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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000';

export default function Login({ onSuccess, onForgot, onSignup, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Save token
        await AsyncStorage.setItem('token', data.token);

        // 🔥 Save user (VERY IMPORTANT)
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Success', 'Login successful');

        // ✅ Send user to app
        onSuccess && onSuccess(data.user);
      } else {
        Alert.alert('Login Error', data.message || 'Invalid credentials');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Server not reachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Login</Text>

        <Image source={require('./assets/page1.png')} style={styles.logo} />
      </View>

      {/* EMAIL */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* PASSWORD */}
      {/* PASSWORD */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#A9A9A9"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#2F6F91"
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {/* FORGOT */}
      <TouchableOpacity onPress={onForgot} style={styles.forgotContainer}>
        <Text style={styles.forgotLink}>Forgot your password?</Text>
      </TouchableOpacity>

      {/* LOGIN BUTTON */}
      <TouchableOpacity style={styles.loginBtn} onPress={login}>
        <Text style={styles.loginBtnText}>
          {loading ? 'Loading...' : 'Login'}
        </Text>
      </TouchableOpacity>

      {/* SIGNUP */}
      <TouchableOpacity
        onPress={onSignup}
        style={{ marginTop: 20, alignItems: 'center' }}
      >
        <Text style={{ color: '#2F6F91' }}>
          Don't have an account?{' '}
          <Text style={{ fontWeight: '600' }}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f5',
    paddingHorizontal: 24,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },

  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 15,
  },

  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8A5A1F',
    flex: 1,
    marginLeft: 15,
  },

  logo: {
    width: 55,
    height: 65,
    resizeMode: 'contain',
  },

  label: {
    color: '#8A5A1F',
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#2F6F91',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    backgroundColor: '#fff',
  },

  forgotContainer: {
    marginTop: 12,
  },

  forgotLink: {
    color: '#2F6F91',
  },

  loginBtn: {
    backgroundColor: '#4A6F85',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 25,
  },

  loginBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F6F91',
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: '#000',
  },
  eyeIcon: {
    marginRight: 10,
  },
});
