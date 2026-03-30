import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const CLOUD_NAME = 'dhjry2uht';
const UPLOAD_PRESET = 'profile_upload';

export default function Writer({ onBack, userData }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📷 PICK IMAGE FROM GALLERY
  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // 💾 SAVE TO DATABASE
  const handleSave = async () => {
    try {
      if (!text.trim()) {
        Alert.alert(
          'Empty',
          'Please write the content of your book/plan first',
        );
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'User not logged in');
        setLoading(false);
        return;
      }

      let imageUrl = 'https://via.placeholder.com/150';

      // ☁️ Upload to Cloudinary if an image is selected
      if (image) {
        const formData = new FormData();
        formData.append('file', {
          uri: image,
          type: 'image/jpeg',
          name: 'upload.jpg',
        });
        formData.append('upload_preset', UPLOAD_PRESET);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData },
        );

        const cloudData = await cloudRes.json();
        if (cloudRes.ok) {
          imageUrl = cloudData.secure_url;
        }
      }

      // 📦 Send to backend - USING CORRECT SCHEMA FIELDS
      const response = await fetch('http://10.0.2.2:3000/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || 'Untitled Plan',
          authors: userData?.name || 'Unknown Author', // ✅ Uses your Profile Name
          description: text, // ✅ Matches Schema
          thumbnail: imageUrl, // ✅ Matches Schema
          categories: 'Personal Plan',
          published_year: 2026,
          num_pages: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save');
      }

      Alert.alert('Success', 'Your plan has been published!', [
        { text: 'OK', onPress: () => onBack({ refresh: true }) },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write your own Plan</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* BOOK TITLE INPUT */}
        <TextInput
          placeholder="Enter Book Title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
        />

        {/* IMAGE PREVIEW AREA */}
        <TouchableOpacity
          style={styles.imagePlaceholder}
          onPress={handlePickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.emptyImageBox}>
              <Text style={styles.uploadLabel}>Tap to add Cover Image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* MAIN CONTENT INPUT */}
        <TextInput
          placeholder="Start writing your content here..."
          placeholderTextColor="#999"
          multiline
          value={text}
          onChangeText={setText}
          style={styles.contentInput}
        />
      </ScrollView>

      {/* FLOATING ACTION BUTTONS */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && { backgroundColor: '#ccc' }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveText}>
          {loading ? 'Saving...' : 'Publish Plan'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.plusBtn} onPress={handlePickImage}>
        <Text style={styles.plusText}>+</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3F1',
    paddingBottom: 10,
  },
  backArrow: { fontSize: 40, color: '#6B4A2B', marginRight: 15, marginTop: -5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#6B4A2B' },
  scrollContent: { paddingBottom: 150 },
  titleInput: {
    marginHorizontal: 20,
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  imagePlaceholder: {
    marginHorizontal: 20,
    marginTop: 20,
    width: 120,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    elevation: 3,
  },
  imagePreview: { width: '100%', height: '100%' },
  emptyImageBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  uploadLabel: { textAlign: 'center', color: '#777', fontSize: 12 },
  contentInput: {
    padding: 20,
    fontSize: 18,
    minHeight: 400,
    color: '#444',
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  saveBtn: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#426A80',
    padding: 18,
    borderRadius: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  plusBtn: {
    position: 'absolute',
    right: 25,
    bottom: 120,
    backgroundColor: '#8A5A1F',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  plusText: { color: '#fff', fontSize: 32, fontWeight: '300' },
});
