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

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ['Account Problem', 'Technical Issue', 'Payment Concern', 'Other'];

  // 1. Pick Image from Gallery
  const pickImage = async () => {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access the image gallery is required!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    // Handle image selection or cancellation
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. Upload Image to Cloudinary
  const uploadToCloudinary = async (uri) => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary environment variables are missing.');
    }

    const data = new FormData();
    data.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'support_screenshot.jpg',
    });
    data.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const fileData = await response.json();
    if (fileData.secure_url) {
      return fileData.secure_url;
    } else {
      throw new Error('Cloudinary upload failed.');
    }
  };

  // 3. Send Email via EmailJS API
  const sendEmailWithEmailJS = async (imageUrl) => {
    const serviceId = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS environment variables are missing.');
    }

    const templateParams = {
      name: name,
      reply_to: email,
      issue_category: category,
      message: message,
      image_url: imageUrl || 'No screenshot provided',
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email via EmailJS.');
    }
  };

  // 4. Submit Form Workflow
  const handleSubmit = async () => {
    // Basic field validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setLoading(true);

    try {
      let uploadedImageUrl = '';

      // Upload screenshot to Cloudinary if selected
      if (imageUri) {
        uploadedImageUrl = await uploadToCloudinary(imageUri);
      }

      // Send email via EmailJS (only after image upload succeeds)
      await sendEmailWithEmailJS(uploadedImageUrl);

      Alert.alert('Success', 'Your support request has been sent successfully!');

      // Reset form on success
      setName('');
      setEmail('');
      setMessage('');
      setImageUri(null);
      setCategory('Technical Issue');
    } catch (error) {
      Alert.alert('Submission Error', error.message || 'An error occurred during submission.');
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
        <Text style={styles.headerTitle}>Customer Support</Text>
        <Text style={styles.subtitle}>Report a problem and attach a screenshot.</Text>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Issue Category</Text>
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

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue..."
          multiline={true}
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />

        <Text style={styles.label}>Screenshot</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Change Screenshot' : 'Select Image from Gallery'}
          </Text>
        </TouchableOpacity>

        {imageUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setImageUri(null)}>
              <Text style={styles.removeText}>Cancel / Remove Image</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1A202C', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#718096', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  selectedCategory: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  categoryText: { fontSize: 13, color: '#4A5568' },
  selectedCategoryText: { color: '#FFFFFF', fontWeight: '600' },
  imagePickerButton: {
    backgroundColor: 'rgb(149, 210, 188)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#A0AEC0',
  },
  imagePickerText: { color: '#2D3748', fontWeight: '600' },
  previewContainer: { alignItems: 'center', marginTop: 12 },
  previewImage: { width: 160, height: 160, borderRadius: 8, marginBottom: 8 },
  removeText: { color: '#E53E3E', fontSize: 13, fontWeight: '600' },
  submitButton: {
    backgroundColor: 'rgb(155, 64, 64)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: { backgroundColor: '#90CDF4' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});