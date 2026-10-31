import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Index() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Account Problem');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ['Account Problem', 'Technical Issue', 'Billing', 'Other'];

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Kailangan mo magbigay ng pahintulot para ma-access ang gallery.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const sendEmail = async () => {
    const templateParams = {
      to_name: 'Support Team',
      from_name: name,
      reply_to: email,
      category: category,
      message: message,
      image_url: imageUri ? 'May in-attach na larawan (Local URI)' : 'Walang in-attach na larawan',
    };

    try {
      console.log('Sending email with params:', templateParams);
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
          template_id: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
          user_id: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
          template_params: templateParams,
        }),
      });

      const responseText = await response.text();
      console.log('EmailJS Response Status:', response.status);
      console.log('EmailJS Response Body:', responseText);

      if (response.ok) {
        Alert.alert('Tagumpay!', 'Naipadala na ang iyong mensahe sa support team.');
        setName('');
        setEmail('');
        setMessage('');
        setImageUri(null);
      } else {
        throw new Error(`Hindi naipadala ang email: ${responseText}`);
      }
    } catch (error) {
      console.error('EmailJS Error Details:', error);
      Alert.alert('Error', 'May nangyaring mali sa pagpapadala ng email.');
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Kulang na Impormasyon', 'Punan ang pangalan, email, at mensahe.');
      return;
    }

    setLoading(true);
    try {
      await sendEmail();
    } catch (error) {
      console.error('Submit Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Customer Support</Text>
        <Text style={styles.subtitle}>Paano kami makatutulong sa iyo ngayon?</Text>

        <Text style={styles.label}>Pangalan</Text>
        <TextInput
          style={styles.input}
          placeholder="Ilagay ang iyong pangalan"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Iyong email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Kategorya ng Problema</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.selectedCategory]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.selectedCategoryText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mensahe / Detalye</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ilarawan ang iyong nararanasan..."
          multiline={true}
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />

        <Text style={styles.label}>Mag-attach ng Screenshot (Opsyonal)</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Palitan ang Larawan' : 'Pumili mula sa Gallery'}
          </Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Ipadala ang Mensahe</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#718093',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f3640',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2f3640',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcdde1',
    backgroundColor: '#fff',
  },
  selectedCategory: {
    backgroundColor: '#40739e',
    borderColor: '#40739e',
  },
  categoryText: {
    fontSize: 13,
    color: '#718093',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  imagePickerButton: {
    backgroundColor: '#718093',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4cd137',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});