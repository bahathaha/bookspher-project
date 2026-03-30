import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000';

export default function Signup({ onLogin, onSuccess }) {
  const [name, setName] = useState(''); // New Name state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const signup = async () => {
    // Updated validation to include name
    if (!name || !email || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(), // Sending name to backend
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ SAVE TOKEN
        await AsyncStorage.setItem('token', data.token);

        // ✅ SAVE USER
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Success', 'Account created successfully!');

        // ✅ LOGIN USER IMMEDIATELY
        onSuccess && onSuccess(data.user);
      } else {
        Alert.alert('Signup Error', data.message || 'Failed to create account');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Server not reachable. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogin}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <Text style={styles.title}>Sign Up</Text>
            <Image source={require('./assets/page1.png')} style={styles.logo} />
          </View>
        </View>

        <TouchableOpacity onPress={onLogin}>
          <Text style={styles.sub}>
            Already have account? <Text style={styles.link}>Login</Text>
          </Text>
        </TouchableOpacity>

        {/* --- NAME FIELD --- */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#A9A9A9"
          value={name}
          onChangeText={setName}
        />

        {/* --- EMAIL FIELD --- */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@mail.com"
          placeholderTextColor="#A9A9A9"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* --- USERNAME FIELD --- */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="choose_a_username"
          placeholderTextColor="#A9A9A9"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* --- PASSWORD FIELD --- */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#A9A9A9"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'} // 👁️ vs 👁️‍🗨️
              size={22}
              color="#2F6F91"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={signup}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f5', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  back: { fontSize: 32, padding: 8, marginRight: 12, color: '#8A5A1F' },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 32, fontWeight: '700', color: '#8A5A1F' },
  logo: { width: 60, height: 70 },
  sub: { color: '#2F6F91', marginVertical: 12 },
  link: { fontWeight: '600' },
  label: { marginTop: 15, color: '#8A5A1F', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#2F6F91',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    color: '#000',
    backgroundColor: '#fff',
  },
  loginBtn: {
    backgroundColor: '#4A6F85',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F6F91',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#000',
  },
  toggleIcon: {
    fontSize: 20,
    color: '#2F6F91',
    paddingHorizontal: 8,
  },
});
