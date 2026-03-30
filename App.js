import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Read from './reader';
import Home from './home';
import Login from './login';
import Signup from './signup';
import Forgot from './forgot';
import Profile from './Profile';
import Writer from './Writer';
const BASE_URL = 'http://10.0.2.2:3000';

const slides = [
  {
    image: require('./assets/onboard1.png'),
    title: 'Find Your Next Great Read!',
    desc: 'Browse thousands of books, from timeless classics to the latest bestsellers.',
  },
  {
    image: require('./assets/onboard2.png'),
    title: 'Curate Your Library!',
    desc: 'Create and manage your own collections.',
  },
  {
    image: require('./assets/onboard3.png'),
    title: 'Join a Community!',
    desc: 'Share reviews and discuss books.',
  },
];

export default function App() {
  const [folders, setFolders] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLaunch, setFirstLaunch] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const [screen, setScreen] = useState('home');
  const [refresh, setRefresh] = useState(false);
  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      const opened = await AsyncStorage.getItem('alreadyOpened');
      const token = await AsyncStorage.getItem('token');

      if (opened) setFirstLaunch(false);

      if (token) {
        try {
          // ✅ EXISTING AUTH
          const res = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (res.ok) {
            setUserData(data.user);
            setIsLoggedIn(true);
          }

          // 🔥 ADD THIS (VERY IMPORTANT)
          const folderRes = await fetch('http://10.0.2.2:3000/api/folders', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const folderData = await folderRes.json();
          setFolders(folderData); // ✅ THIS FIXES YOUR PROBLEM
        } catch (err) {
          console.log(err);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  /* ================= ONBOARD ================= */
  const finishOnboarding = async () => {
    await AsyncStorage.setItem('alreadyOpened', 'true');
    setFirstLaunch(false);
  };

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  let content = null;

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#426A80" />
      </View>
    );
  } else if (firstLaunch) {
    content = (
      <>
        <View style={styles.content}>
          <Image source={slides[slideIndex].image} style={styles.image} />
          <Text style={styles.title}>{slides[slideIndex].title}</Text>
          <Text style={styles.description}>{slides[slideIndex].desc}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={nextSlide}>
            <Text style={styles.buttonText}>
              {slideIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  } else if (screen === 'login') {
    content = (
      <Login
        onSignup={() => setScreen('signup')}
        onForgot={() => setScreen('forgot')}
        onBack={() => setScreen('home')}
        onSuccess={async data => {
          const user = data.user || data;

          setUserData(user);
          setIsLoggedIn(true);

          await AsyncStorage.setItem('user', JSON.stringify(user));
          if (data.token) {
            await AsyncStorage.setItem('token', data.token);
          }

          setScreen('home');
        }}
      />
    );
  } else if (screen === 'signup') {
    content = (
      <Signup
        onLogin={() => setScreen('login')}
        onBack={() => setScreen('login')}
        onSuccess={async data => {
          const user = data.user || data;

          setUserData(user);
          setIsLoggedIn(true);

          await AsyncStorage.setItem('user', JSON.stringify(user));
          if (data.token) {
            await AsyncStorage.setItem('token', data.token);
          }

          setScreen('home');
        }}
      />
    );
  } else if (screen === 'forgot') {
    content = (
      <Forgot
        onBack={() => setScreen('login')}
        onSuccess={async data => {
          const user = data.user || data;

          setUserData(user);
          setIsLoggedIn(true);

          await AsyncStorage.setItem('user', JSON.stringify(user));
          if (data.token) {
            await AsyncStorage.setItem('token', data.token);
          }

          setScreen('home');
        }}
      />
    );
  } else if (screen === 'reader') {
    if (!selectedBook) {
      return (
        <View style={styles.center}>
          <Text>No book selected</Text>
        </View>
      );
    }

    content = (
      <Read
        bookId={selectedBook._id}
        title={selectedBook.title}
        author={selectedBook.authors}
        categories={selectedBook?.categories}
        description={selectedBook?.description}
        onBack={() => setScreen('home')}
        folders={folders}
        setFolders={setFolders}
      />
    );
  } else if (screen === 'profile') {
    content = (
      <Profile
        userData={userData}
        refresh={refresh}
        onOpenLogin={async () => {
          await AsyncStorage.clear();
          setUserData(null);
          setIsLoggedIn(false);
          setScreen('home');
        }}
        onUpdateUser={updatedUser => {
          setUserData(updatedUser);
        }}
      />
    );
  } else if (screen === 'writer') {
    content = (
      <Writer
        userData={userData}
        onBack={data => {
          console.log('DATA FROM WRITER:', data); // ✅

          if (data?.refresh) {
            setRefresh(prev => !prev);
          }

          if (data?.book) {
            console.log('BOOK DATA:', data.book); // ✅
          }

          setScreen('home');
        }}
      />
    );
  }
  // Inside App.js, locate the 'else' block (the home/explore screen)
  else {
    content = (
      <Home
        isLoggedIn={isLoggedIn}
        userData={userData}
        onOpenLogin={() => setScreen('login')}
        onOpenProfile={() => setScreen('profile')}
        // ✅ ADD THIS LINE:
        onOpenWriter={() => setScreen('writer')}
        onOpenReader={async book => {
          if (!book) return;
          console.log('SELECTED BOOK:', book);
          setSelectedBook(book);
          setScreen('reader');
          await AsyncStorage.setItem('lastBook', JSON.stringify(book));
        }}
        folders={folders}
        setFolders={setFolders}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>{content}</SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  image: { width: 250, height: 250, resizeMode: 'contain', marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: { fontSize: 16, color: 'gray', textAlign: 'center' },
  button: {
    backgroundColor: '#426A80',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
