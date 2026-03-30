import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
const ThickSlider = ({ value, onValueChange, sliderWidth, setSliderWidth }) => {
  const progressWidth = value * sliderWidth;

  const panResponder = useRef(
    PanResponder.create({
      // We set this to true to capture touches
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate position relative to the slider's start
        // 90 is an approximation of the left padding/label;
        // using locationX is often more reliable for internal hits.
        const touchX = evt.nativeEvent.locationX;
        const newValue =
          Math.min(Math.max(0, touchX), sliderWidth) / sliderWidth;
        onValueChange(newValue);
      },
    }),
  ).current;

  return (
    <View
      style={styles.sliderContainer}
      onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderBackground} />
      <View style={[styles.sliderActive, { width: progressWidth }]} />
      <View style={[styles.sliderThumb, { left: progressWidth - 10 }]} />
    </View>
  );
};

const Read = ({ title, categories, author, description, onBack, bookId }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [isDark, setIsDark] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(0);
  const [margin, setMargin] = useState(25);
  const [sliderWidth, setSliderWidth] = useState(0);

  const themeBg = isDark ? '#121212' : '#F5F5F5';
  const themeText = isDark ? '#E0E0E0' : '#333333';
  const toggleWishlist = async () => {
    if (!bookId || bookId === 'undefined') {
      alert('Error: Book ID is missing!');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Please login to save books!');
        return;
      }

      // 1. UI Feedback (Optimistic Update)
      const oldState = isBookmarked;
      setIsBookmarked(!oldState);

      // 2. Call the NEW endpoint in routes/books.js
      const res = await fetch(
        `http://10.0.2.2:3000/api/books/${bookId}/wishlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        setIsBookmarked(oldState); // Rollback if server fails
        alert('Could not save to Wish List');
      }
    } catch (err) {
      console.log('Wishlist Error:', err);
    }
  };
  // Handle Scroll Movement (Scroll -> Slider)
  const handleScroll = event => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const totalScrollableHeight = contentSize.height - layoutMeasurement.height;

    if (totalScrollableHeight > 0) {
      const currentProgress = contentOffset.y / totalScrollableHeight;
      // Clamp values between 0 and 1
      setProgress(Math.min(Math.max(0, currentProgress), 1));
    }
  };

  // Handle Slider Movement (Slider -> Scroll)
  const handleSliderChange = newVal => {
    setProgress(newVal);
    if (scrollRef.current) {
      // We need to measure content to know where to scroll
      // Note: This is an estimation. In a production app,
      // you'd track the contentHeight via onContentSizeChange.
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: 64 + insets.top },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack}>
            <Icon name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsDark(!isDark)}>
            <Icon
              name="format-letter-case"
              size={26}
              color={isDark ? '#FFCC00' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
            <Icon
              name={isFavorite ? 'square-edit-outline' : 'pencil-outline'}
              size={22}
              color={isFavorite ? '#4CAF50' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleWishlist}>
            <Icon
              name={isBookmarked ? 'star' : 'star-outline'}
              size={24}
              color={isBookmarked ? '#FFD700' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        // Scroll event frequency (16 is ~60fps)
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{
          paddingHorizontal: margin,
          paddingTop: 30,
          paddingBottom: 250,
        }}
      >
        <View style={styles.bookInfoSection}>
          <Text style={[styles.bookTitle, { color: themeText }]}>{title}</Text>
          <Text style={[styles.bookGenre, { color: themeText }]}>
            A {categories} by
          </Text>
          <Text style={[styles.bookAuthor, { color: themeText }]}>
            {author}
          </Text>
        </View>
        <Text style={[styles.bodyText, { color: themeText }]}>
          {description}
        </Text>
      </ScrollView>

      {/* CONTROL PANEL */}
      <View style={[styles.overlayPanel, { bottom: insets.bottom + 20 }]}>
        <View style={styles.panelRow}>
          <Text style={styles.panelLabel}>Progress</Text>
          <ThickSlider
            value={progress}
            onValueChange={handleSliderChange}
            sliderWidth={sliderWidth}
            setSliderWidth={setSliderWidth}
          />
        </View>

        <View
          style={[
            styles.panelRow,
            { marginTop: 20, justifyContent: 'space-between' },
          ]}
        >
          <View style={styles.controlGroup}>
            <Text style={styles.panelLabel}>Dark</Text>
            <TouchableOpacity
              onPress={() => setIsDark(!isDark)}
              style={[
                styles.toggleTrack,
                { backgroundColor: isDark ? '#4A6572' : '#767577' },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { alignSelf: isDark ? 'flex-end' : 'flex-start' },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.panelLabel}>Margin</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setMargin(Math.max(10, margin - 5))}
              >
                <Text style={styles.stepperBtn}>—</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMargin(Math.min(60, margin + 5))}
              >
                <Text style={styles.stepperBtn}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
// ... styles remain largely the same, but ensure sliderContainer doesn't have restrictive margins

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#4A6572',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 5,
  },
  bookInfoSection: { alignItems: 'center', marginBottom: 30 },
  bookTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  bookGenre: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 4,
  },
  bookAuthor: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  bodyText: { fontSize: 18, lineHeight: 28 },
  overlayPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#A0795D',
    borderRadius: 28,
    padding: 22,
    elevation: 10,
  },
  panelRow: { flexDirection: 'row', alignItems: 'center' },
  panelLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  sliderContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginLeft: 15,
  },
  sliderBackground: {
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    width: '100%',
    position: 'absolute',
  },
  sliderActive: {
    height: 6,
    backgroundColor: '#4A6572',
    borderRadius: 3,
    position: 'absolute',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    elevation: 5,
  },
  controlGroup: { flexDirection: 'row', alignItems: 'center' },
  stepper: { flexDirection: 'row', gap: 25, marginLeft: 20 },
  stepperBtn: { color: '#FFF', fontSize: 24 },
  toggleTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
    marginLeft: 10,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
});

export default Read;
