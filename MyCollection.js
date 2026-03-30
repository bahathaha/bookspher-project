import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function MyCollection({
  onOpenReader,
  onFolderOpen,
  folders,
  setFolders,
  onOpenWriter,
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState('');

  const [books, setBooks] = useState([]);
  const createFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch('http://10.0.2.2:3000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      });

      const data = await res.json();

      // ✅ INSTANT UI UPDATE
      setFolders(prev => [data, ...prev]);

      setFolderName('');
      setShowModal(false);
    } catch (err) {
      console.log(err);
    }
  }; /* ---------------- LOADING ---------------- */

  if (selectedFolder) {
    return (
      <View style={styles.container}>
        <View
          style={{
            paddingTop: 50,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedFolder(null);
              onFolderOpen(false);
            }}
            style={{ marginRight: 10 }}
          >
            <Text
              style={{
                fontSize: 35,
                fontWeight: '600',
                color: '#333',
              }}
            >
              ‹
            </Text>
          </TouchableOpacity>

          {/* 📂 FOLDER NAME */}
          <Text
            style={{
              fontSize: 35,
              fontWeight: '700',
              color: '#522E09',
            }}
          >
            {selectedFolder.name}
          </Text>
        </View>

        {selectedFolder.books?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text>No books in this folder</Text>
          </View>
        ) : (
          <ScrollView>
            {selectedFolder.books.map((book, index) => (
              <TouchableOpacity
                key={index}
                style={styles.folderItem}
                onPress={() => {
                  if (!book) return;
                  onOpenReader(book);
                }}
              >
                <Image
                  source={{
                    uri:
                      book.thumbnail || 'https://via.placeholder.com/60x80.png',
                  }}
                  style={styles.image}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.folderTitle}>{book.title}</Text>
                  <Text style={styles.folderSubtitle}>{book.authors}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={async () => {
            try {
              const lastBook = await AsyncStorage.getItem('lastBook');

              if (!lastBook) {
                alert('No recent book found');
                return;
              }

              onOpenReader(JSON.parse(lastBook));
            } catch (err) {
              console.log(err);
            }
          }}
        >
          <Text style={styles.mainButtonText}>Continue Reading</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={onOpenWriter}>
          <Text style={styles.mainButtonText}>Continue Writing</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              // 1. Fetch books where the user ID is in the wishlistUsers array
              const res = await fetch(
                'http://10.0.2.2:3000/api/books/wishlist',
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              const data = await res.json();

              if (res.ok) {
                // 2. Create a "fake" folder object to show the books in the existing UI
                setSelectedFolder({
                  name: 'My Wish List',
                  books: data.books, // These are the books returned from your new backend route
                });
                onFolderOpen(true);
              }
            } catch (err) {
              console.log('Wishlist fetch error:', err);
              alert('Could not load Wish List');
            }
          }}
        >
          <Text style={styles.mainButtonText}>My Wish List</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* 🔹 My Folders */}
        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>My Folders</Text>
        <View style={styles.divider} />

        {/* 🔹 EMPTY STATE */}
        {folders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="book-outline" size={70} color="#C9C2B8" />
            <Text style={styles.emptyTitle}>No Books Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your saved books will appear here
            </Text>
          </View>
        ) : (
          folders.map(folder => (
            <TouchableOpacity
              key={folder._id}
              style={styles.folderItem}
              onPress={() => {
                const updatedFolder = folders.find(f => f._id === folder._id);
                setSelectedFolder(updatedFolder);
                onFolderOpen(true);
              }}
            >
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/716/716784.png',
                }}
                style={styles.ho}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.folderTitle}>{folder.name}</Text>
                <Text style={styles.folderSubtitle}>
                  {folder.books?.length || 0} books
                </Text>
              </View>

              <Icon name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Create Folder</Text>

            <TextInput
              placeholder="Enter folder name"
              value={folderName}
              onChangeText={setFolderName}
              style={styles.input}
            />

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity style={styles.createBtn} onPress={createFolder}>
                <Text style={{ color: '#fff' }}>Create</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* 🔹 Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F1',
    paddingHorizontal: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B4A2B',
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#CFCFCF',
    marginVertical: 10,
  },

  /* 🔹 Top Blue Buttons */
  mainButton: {
    backgroundColor: '#557C8D',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* 🔹 Folder Items */
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },

  image: {
    width: 55,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },

  folderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  folderSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },

  /* 🔹 Empty */
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 14,
    color: '#8A5A1F',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },

  /* 🔹 Floating Button */
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#557C8D',
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },

  createBtn: {
    backgroundColor: '#557C8D',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },

  cancelBtn: {
    padding: 10,
  },
  ho: {
    height: 30,
    width: 30,
    marginRight: 12,
    resizeMode: 'contain',
    tintColor: '#557C8D',
  },
});
