import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://10.0.2.2:3000';

const DEFAULT_PROFILE_IMAGE = require('./assets/profile.png');

/* ================= PERMISSION ================= */
async function requestStoragePermission() {
  if (Platform.OS !== 'android') return true;

  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await PermissionsAndroid.request(permission);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/* ================= CLOUDINARY ================= */
const CLOUD_NAME = 'dhjry2uht';
const UPLOAD_PRESET = 'profile_upload';

const uploadToCloudinary = async uri => {
  try {
    const data = new FormData();

    data.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    data.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: data,
      },
    );

    const json = await res.json();
    console.log('Cloudinary:', json);

    if (!json.secure_url) {
      Alert.alert('Image upload failed');
      return null;
    }

    return json.secure_url;
  } catch (err) {
    console.log('Upload error:', err);
    Alert.alert('Upload error');
    return null;
  }
};

/* ================= GUEST ================= */
const GuestView = ({ onOpenLogin }) => (
  <View style={styles.guestContainer}>
    <View style={styles.guestHeader}>
      <Svg width={width} height={350} style={styles.guestSvg}>
        <Path
          d={`M0 0 H${width} V220 Q${width / 2} 320 0 220 Z`}
          fill="#426A80"
        />
      </Svg>
      <View style={styles.guestLogoWrapper}>
        <View style={styles.logoCircle}>
          <Icon name="person-outline" size={80} color="#426A80" />
        </View>
      </View>
    </View>

    <View style={styles.guestContent}>
      <Text style={styles.guestTitle}>Welcome to Booksphere</Text>
      <Text style={styles.guestSubtitle}>
        Log in to manage your publications, update your bio, and join our
        reading community.
      </Text>

      <TouchableOpacity style={styles.guestLoginBtn} onPress={onOpenLogin}>
        <Text style={styles.guestLoginText}>Login / Sign Up</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/* ================= MAIN ================= */
export default function Profile({
  userData,
  onOpenLogin,
  onUpdateUser,
  refresh,
  onOpenBook,
}) {
  // ✅ ALL hooks together at top
  const [publications, setPublications] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tempRole, setTempRole] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');
  const [hobby, setHobby] = useState('');
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        console.log('TOKEN:', token);

        if (!token) {
          console.log('User not logged in');
          return;
        }

        const res = await fetch('http://10.0.2.2:3000/api/books', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        console.log('RAW:', text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log('JSON ERROR', e);
          return;
        }

        console.log('BOOKS:', data.books);

        setPublications(data.books || []);
      } catch (err) {
        console.log('FETCH ERROR:', err);
      }
    };

    fetchBooks();
  }, [refresh]);
  useEffect(() => {
    if (userData) {
      setTempRole(userData.role || '');
      setTempBio(userData.bio || '');

      setRole(userData.role || '');
      setBio(userData.bio || '');
      setDob(userData.dob || '');
      setHobby(userData.hobby || '');
    }
  }, [userData]);

  // ✅ ONLY NOW condition
  if (!userData) {
    return <GuestView onOpenLogin={onOpenLogin} />;
  }

  /* ================= SAVE ================= */
  const saveField = async (field, value) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      const text = await res.text();
      console.log('BACKEND RAW:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert('Server error');
        return;
      }

      if (res.ok) {
        onUpdateUser && onUpdateUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      } else {
        Alert.alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Server error');
    }
  };

  /* ================= IMAGE PICK ================= */
  const changePhoto = async () => {
    const permission = await requestStoragePermission();
    if (!permission) {
      Alert.alert('Permission denied');
      return;
    }

    launchImageLibrary({ mediaType: 'photo' }, async res => {
      if (res.didCancel || !res.assets) return;

      const uri = res.assets[0].uri;

      try {
        setUploading(true);

        const imageUrl = await uploadToCloudinary(uri);

        if (imageUrl) {
          await saveField('profileImage', imageUrl);
        }
      } finally {
        setUploading(false);
      }
    });
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: '#f6f6f5' }}>
      <View style={styles.headerContainer}>
        <Svg width={width} height={220}>
          <Path
            d={`M0 0 H${width} V160 Q${width / 2} 220 0 160 Z`}
            fill="#426A80"
          />
        </Svg>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowSettings(true)}
        >
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarWrapper}>
        <TouchableOpacity style={styles.avatarContainer} onPress={changePhoto}>
          {uploading ? (
            <ActivityIndicator color="#426A80" />
          ) : (
            <View style={styles.imageContainer}>
              <Image
                source={
                  userData.profileImage
                    ? {
                        uri:
                          userData.profileImage + '?t=' + new Date().getTime(),
                      } // ✅ ONLY CHANGE
                    : DEFAULT_PROFILE_IMAGE
                }
                style={styles.avatar}
              />

              <View style={styles.cameraBadge}>
                <Icon name="camera" size={18} color="#fff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.username}>@{userData.username}</Text>
        <Text style={styles.role}>{role || 'Tap to add role'}</Text>
        <Text style={styles.bio}>{bio || 'Tap to add bio'}</Text>
      </View>

      <Text style={styles.pubTitle}>Publications</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          data={publications}
          keyExtractor={item => item._id}
          ListHeaderComponent={renderHeader}
          numColumns={3} // 🔴 This creates the grid look
          columnWrapperStyle={styles.gridRow} // Spaces the books out
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookGridCard}
              onPress={() => onOpenBook && onOpenBook(item)} // 🔥 CLICK ACTION
            >
              <Image
                source={{
                  uri: item.thumbnail || 'https://via.placeholder.com/150',
                }}
                style={styles.bookGridImage}
              />
              {/* Optional: Add title below if you want, but the target image is just covers */}
              <Text style={styles.bookGridTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
        {showSettings && (
          <View style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => {
                setShowSettings(false);
                setShowUpgrade(true);
              }}
            >
              <Text style={styles.settingText}>Upgrade Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => {
                onOpenLogin();
              }}
            >
              <Text style={styles.settingText}>Signin</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={{ marginTop: 20, color: 'gray' }}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        {showUpgrade && (
          <View style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Upgrade Profile</Text>

            <TextInput
              placeholder="Role"
              value={role}
              onChangeText={setRole}
              style={styles.input}
            />

            <TextInput
              placeholder="Bio"
              value={bio}
              onChangeText={setBio}
              style={styles.input}
            />

            <TextInput
              placeholder="DOB"
              value={dob}
              onChangeText={setDob}
              style={styles.input}
            />

            <TextInput
              placeholder="Hobby"
              value={hobby}
              onChangeText={setHobby}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.settingBtn}
              onPress={async () => {
                const token = await AsyncStorage.getItem('token');

                const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ role, bio, dob, hobby }),
                });

                const data = await res.json();

                if (res.ok) {
                  const updated = data.user;

                  onUpdateUser && onUpdateUser(updated);

                  setRole(updated.role || '');
                  setBio(updated.bio || '');
                  setDob(updated.dob || '');
                  setHobby(updated.hobby || '');

                  await AsyncStorage.setItem('user', JSON.stringify(updated));

                  Alert.alert('Profile upgraded ✅');
                  setShowUpgrade(false);
                }
              }}
            >
              <Text style={styles.settingText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowUpgrade(false)}>
              <Text style={{ marginTop: 15, color: 'gray' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  headerContainer: { position: 'relative' },
  logoutButton: { position: 'absolute', top: 50, right: 20 },
  avatarWrapper: {
    position: 'absolute',
    top: 110,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  imageContainer: { width: 140, height: 140, position: 'relative' },
  avatar: { width: 140, height: 140, borderRadius: 70 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#426A80',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  infoSection: { alignItems: 'center', marginTop: 75 },
  name: { fontSize: 28, fontWeight: 'bold' },
  username: { fontSize: 16, color: '#777' },
  role: { fontSize: 16, color: '#426A80', marginTop: 6 },
  bio: { fontSize: 14, color: '#8A5A1F', marginTop: 6 },
  pubTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 30,
    color: '#93580f',
  },
  gridRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
  },
  bookGridCard: {
    width: (width - 60) / 3, // Calculates width for 3 columns with spacing
    margin: 5,
    alignItems: 'center',
  },
  bookGridImage: {
    width: '100%',
    height: 140, // Height for the book cover look
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  bookGridTitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#333',
  },

  // Header Tab Styles (to match "Publications | Followers | Following")
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  guestContainer: { flex: 1, backgroundColor: '#f6f6f5' },
  guestHeader: { height: 380, alignItems: 'center', justifyContent: 'center' },
  guestSvg: { position: 'absolute', top: 0 },
  guestLogoWrapper: { marginTop: 60 },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestContent: { flex: 1, paddingHorizontal: 40, alignItems: 'center' },
  guestTitle: { fontSize: 28, fontWeight: 'bold' },
  guestSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40 },
  guestLoginBtn: {
    width: '100%',
    backgroundColor: '#426A80',
    padding: 16,
    borderRadius: 12,
  },
  guestLoginText: { color: '#fff', textAlign: 'center' },
  settingsPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  settingsTitle: { fontSize: 20, fontWeight: 'bold' },
  settingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#426A80',
  },
  settingText: { color: '#fff', textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
});
