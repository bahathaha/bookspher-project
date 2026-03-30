import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Search({ onBack, onOpenDetail }) {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Writer');
  const [results, setResults] = useState([]);

  const filters = ['Novel', 'Writer', 'Drama'];

  // 🔥 SEARCH API CALL
  useEffect(() => {
    const fetchSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const res = await fetch(
          `http://10.0.2.2:3000/api/books/search?q=${query}&filter=${activeFilter}`,
        );
        const data = await res.json();
        setResults(data.books || []);
      } catch (err) {
        console.log(err);
      }
    };

    const delay = setTimeout(fetchSearch, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color="#777" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            style={styles.input}
          />
        </View>
      </View>

      {/* FILTER ROW */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterIcon}>
          <Icon name="options-outline" size={18} color="#426A80" />
        </TouchableOpacity>

        {filters.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, activeFilter === item && styles.chipActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === item && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RESULTS */}
      <View style={styles.resultSection}>
        <Text style={styles.sectionTitle}>{activeFilter}</Text>

        {results.length === 0 ? (
          <Text style={styles.emptyText}>
            No {activeFilter} Available for this name
          </Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  onOpenDetail(item);
                }}
              >
                <Image
                  source={{
                    uri:
                      item.thumbnail ||
                      'https://via.placeholder.com/100x150.png',
                  }}
                  style={styles.resultImage}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultAuthor}>
                    {item.authors || 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  filterIcon: {
    padding: 6,
  },

  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EAEAEA',
  },

  chipActive: {
    backgroundColor: '#426A80',
  },

  chipText: {
    fontSize: 13,
    color: '#333',
  },

  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  resultSection: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A5A1F',
    marginBottom: 8,
  },

  emptyText: {
    color: '#999',
    fontSize: 13,
  },

  // 🔥 NEW STYLES
  resultItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },

  resultImage: {
    width: 50,
    height: 70,
    marginRight: 10,
    borderRadius: 6,
  },

  resultTitle: {
    fontWeight: '600',
  },

  resultAuthor: {
    color: '#777',
    fontSize: 12,
  },
});
