import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

const BASE_URL = 'http://10.0.2.2:3000';

export default function Forgot({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  /* ================= BACK ================= */
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setCode(['', '', '', '', '', '']);
    } else {
      onBack && onBack();
    }
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Enter email');

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/otp/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          Alert.alert('Not Found', 'Email not registered. Please sign up.');
        } else {
          Alert.alert('Error', data.error || 'Failed to send OTP');
        }
        return;
      }

      setStep(2);
      Alert.alert('Success', 'OTP sent to your email');
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Server not reachable');
    } finally {
      setLoading(false);
    }
  };
  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    const otp = code.join('');

    if (otp.length !== 6) {
      return Alert.alert('Error', 'Enter 6-digit OTP');
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/otp/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          Alert.alert('Not Found', 'Email not registered. Please sign up.');
        } else {
          Alert.alert('Error', data.error || 'Invalid OTP');
        }
        return;
      }

      Alert.alert('Success', 'Logged in successfully ✅');

      // 🔥 LOGIN USER
      onSuccess &&
        onSuccess({
          user: data.user,
          token: data.token,
        });
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  /* ================= OTP INPUT ================= */
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // move forward
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // move back if deleted
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK */}
      <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* TITLE */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Verify</Text>
          <Image source={require('./assets/page1.png')} style={styles.logo} />
        </View>

        {/* STEP 1 */}
        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>Enter your Email</Text>
            <Text style={styles.desc}>
              We'll send a code to confirm your identity.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#A4C1D0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={sendOtp}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* STEP 2 */}
            <Text style={styles.subtitle}>Enter Code</Text>
            <Text style={styles.desc}>
              Enter the 6-digit code sent to {email}
            </Text>

            <View style={styles.otpRow}>
              {code.map((v, i) => (
                <TextInput
                  key={i}
                  ref={r => (inputs.current[i] = r)}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={v}
                  onChangeText={t => handleCodeChange(t, i)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={verifyOtp}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  headerBack: { padding: 20 },
  backIcon: { fontSize: 40 },

  content: { paddingHorizontal: 25 },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  titleText: { fontSize: 40, fontWeight: '600', color: '#5D4037' },
  logo: { width: 55, height: 55 },

  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  desc: { fontSize: 13, color: '#888', marginBottom: 25 },

  inputContainer: {
    borderWidth: 1,
    borderColor: '#A4C1D0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 35,
  },

  input: { height: 48 },

  mainBtn: {
    backgroundColor: '#426A80',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },

  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#A4C1D0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
  },
});
