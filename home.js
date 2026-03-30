import React, { useState, useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width } = Dimensions.get("window");

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ScrollView,

} from "react-native";

import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Search from "./Search";
import MyCollection from "./MyCollection";
import Profile from "./Profile";

export default function ExploreScreen({
  onOpenLogin,
  onOpenReader,
  userData,
  folders,
  setFolders,
  onOpenWriter
}){
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const insets = useSafeAreaInsets();
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("explore");
  const [showCustomize, setShowCustomize] = useState(false);

  // ✅ FIX: MISSING STATES (this broke your UI)
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [readingLevel, setReadingLevel] = useState("Beginner");

  const handleSave = () => {
    setShowCustomize(false);
  };

  useEffect(() => {
  fetch("http://10.0.2.2:3000/api/books/public")
      .then((res) => res.json())
      .then((data) => setBooks(data.books))
      .catch((err) => console.log(err));
  }, []);
 
const saveBookToFolder = async (folderId) => {
  try {
    // ✅ 1. CLOSE MODAL INSTANTLY
    setShowFolderModal(false);

    // ✅ 2. UPDATE UI INSTANTLY (NO WAIT)
    setFolders(prev =>
      prev.map(folder =>
        folder._id === folderId
          ? {
              ...folder,
              books: [
  ...(folder.books || []),
  {
    _id: selectedBook._id,
    title: selectedBook.title || "Unknown",
    authors: selectedBook.authors || "Unknown",
    thumbnail: selectedBook.thumbnail,
    categories: selectedBook.categories || "General",
    description: selectedBook.description || "No description",
  },
],
            }
          : folder
      )
    );

    // ✅ 3. OPTIONAL FEEDBACK
    alert("Book saved!");

   
    const token = await AsyncStorage.getItem("token");

    fetch("http://10.0.2.2:3000/api/folders/add-book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        folderId,
        book: {
           _id: selectedBook._id, 
          title: selectedBook.title,
          authors: selectedBook.authors,
          thumbnail: selectedBook.thumbnail,
          categories: selectedBook.categories,
          description: selectedBook.description,
        },
      }),
    });

  } catch (err) {
    console.log(err);
  }
};
 const renderBook = ({ item }) => {
  // ✅ FIX: Determine the correct image source
  let imageUri = "https://via.placeholder.com/150"; // Default fallback

  if (item.thumbnail) {
    if (item.thumbnail.startsWith("http")) {
      // It's a direct Cloudinary/Web URL - use it as is!
      imageUri = item.thumbnail;
    } else if (item.thumbnail.includes("id=")) {
      // It's an old Google Books ID format
      const bookId = item.thumbnail.split("id=")[1]?.split("&")[0];
      imageUri = `https://books.google.com/books/content?id=${bookId}&printsec=frontcover&img=1&zoom=1`;
    }
  }

  return (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() =>
  setSelectedBook({
    ...item,
    _id: item._id, 
  })
}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.bookImage}
        resizeMode="cover" 
      />
      <Text style={styles.bookTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {item.authors || "Unknown Author"}
      </Text>
      <Text style={styles.bookRating}>
        ⭐ {item.average_rating || "N/A"}
      </Text>
    </TouchableOpacity>
  );
};

  const renderContent = () => {
    if (selectedBook) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
          {/* TOP CURVE (SVG) */}
          <View>
            <Svg width={width} height={260}>
              <Path
                d={`M0 0 H${width} V180 Q${width / 2} 260 0 180 Z`}
                fill="#426A80"
              />
            </Svg>

            {/* BACK BUTTON */}
            <TouchableOpacity
              style={{ position: "absolute", top: 50, left: 16 }}
              onPress={() => setSelectedBook(null)}
            >
              <Icon name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* IMAGE SECTION - Moved inside this View for better layering */}
            <View style={{
              position: "absolute",
              top: 100,
              width: "100%",
              alignItems: "center",
            }}>
              <Image
                source={{
                  uri: selectedBook.thumbnail?.startsWith('http') 
                    ? selectedBook.thumbnail 
                    : selectedBook.thumbnail?.includes("id=")
                    ? `https://books.google.com/books/content?id=${selectedBook.thumbnail.split("id=")[1]?.split("&")[0]}&printsec=frontcover&img=1&zoom=1`
                    : "https://via.placeholder.com/170x220.png"
                }}
                style={styles.detailImage}
              />
            </View>
          </View>

          {/* TEXT SECTION - Adjusted Margin to prevent overlap with image */}
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Text style={styles.titleText}>
              {selectedBook.title || "Untitled"}
            </Text>

            <Text style={styles.authorText}>
              {selectedBook.authors || "Unknown Author"}
            </Text>

            <Text style={styles.categoryText}>
              {selectedBook.categories || "General"}
            </Text>
          </View>

          {/* INFO ROW */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year</Text>
              <Text style={styles.infoValue}>{selectedBook.published_year || "2025"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>English</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Pages</Text>
              <Text style={styles.infoValue}>{selectedBook.num_pages || "1"}</Text>
            </View>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowFolderModal(true)}>
              <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
          
          </View>

          {/* REVIEWS */}
       
        </ScrollView>
      );
    }
  
    if (showSearch) {
      return (
        <Search
          value={searchText}
          onChange={setSearchText}
          onClose={() => setShowSearch(false)}
          onBack={() => setShowSearch(false)}
              onOpenDetail={(book) => {
        setShowSearch(false);    
        setSelectedBook(book);   
      }}
        />
      );
    }

   
if (activeTab === "collection") {
  return (
    <MyCollection 
      onOpenReader={onOpenReader} 
      onFolderOpen={setIsFolderOpen}
      folders={folders}
      setFolders={setFolders}
      onOpenWriter={onOpenWriter} 
    />
  );
}

    if (activeTab === "profile") {
  return (
    <Profile
      onOpenLogin={onOpenLogin}
      userData={userData}
      onOpenBook={(book) => {
        setSelectedBook(book);   // 🔥 THIS opens detail screen
        setActiveTab("explore"); // optional (switch tab)
      }}
    />
  );
}

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
        }}
      >
        <View style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Top Pick for You</Text>

          <FlatList
            data={books}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item, index) =>
              item._id?.toString() || index.toString()
            }
            renderItem={renderBook}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          />
        </View>

      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {!selectedBook && activeTab !== "profile"&&  !isFolderOpen && (
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {!showSearch && !showCustomize && activeTab !== "profile" && (
          <Text style={styles.title}>
            {activeTab === "explore" && "Explore"}
            {activeTab === "collection" && "My Collection"}
          </Text>
        )}

        {!showSearch && !showCustomize && activeTab === "explore" && (
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(true)}>
              <Icon name="search-outline" size={22} color="#555" />
            </TouchableOpacity>

          </View>
        )}
      </View>
          )}
      {!showCustomize && activeTab !== "profile" && <View style={styles.divider} />}

     <View style={{ flex: 1 }}>{renderContent()}</View>

{/* ✅ ADD HERE (GLOBAL MODAL) */}
{showFolderModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>

      <Text style={styles.modalTitle}>Select Folder</Text>

      {folders.map((folder) => (
        <TouchableOpacity
          key={folder._id}
          style={{ paddingVertical: 10 }}
          onPress={() => saveBookToFolder(folder._id)}
        >
          <Text style={{ fontSize: 16 }}>{folder.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => setShowFolderModal(false)}>
        <Text style={{ marginTop: 10 }}>Cancel</Text>
      </TouchableOpacity>

    </View>
  </View>
)}

      {!selectedBook&&!showCustomize && !showSearch  &&  !isFolderOpen  &&(
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("collection")}>
            <Icon name="library-outline" size={22} color={activeTab === "collection" ? "#8A5A1F" : "#777"} />
            <Text style={[styles.tabText, activeTab === "collection" && styles.active]}>
              My Collection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("explore")}>
            <Icon name="add-circle" size={26} color={activeTab === "explore" ? "#8A5A1F" : "#777"} />
            <Text style={[styles.tabText, activeTab === "explore" && styles.active]}>
              Explore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("profile")}>
            <Icon name="person-outline" size={22} color={activeTab === "profile" ? "#8A5A1F" : "#777"} />
            <Text style={[styles.tabText, activeTab === "profile" && styles.active]}>
              My Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* STYLES SAME AS YOURS */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f5" ,   paddingTop:14},

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
 
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#8A5A1F",
  },

  headerIcons: { flexDirection: "row", gap: 16 },

  iconBtn: { padding: 6 },

  divider: {
    height: 1,
    backgroundColor: "#C9C2B8",
    marginHorizontal: 16,
  },

  content: { flex: 1, paddingHorizontal: 16 },

  cardTitle: { fontSize: 16, fontWeight: "600", color: "#426A80" },

  cardSub: { color: "#777", marginTop: 4 },

  bottomNav: {
    minHeight: 60,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 8,
  },

  tab: { alignItems: "center" },

  tabText: { fontSize: 12, color: "#777", marginTop: 2 },

  active: { color: "#8A5A1F", fontWeight: "600" },

  bookImage: {
  width: 165,
  height: 205,
 
  marginTop:10,
},

bookTitle: {
  fontSize: 14,
  fontWeight: "600",
  marginTop: 6,
  width: 164,
},

bookAuthor: {
  fontSize: 13,
  color: "#777",
  width: 164,
},

bookRating: {
  fontSize: 12,
  color: "#444",
  marginTop: 2,
},
bookCard: {
  width: 165,
  marginBottom: 16,
},


backBtn: {
  marginTop: 40,
  marginLeft: 16,
},

detailImage: {
  width: 170,
  height: 220,
  borderRadius: 10,
  backgroundColor: "#fff",
  alignSelf: "center",   // ✅ THIS FIXES CENTER
},

titleText: {
  fontSize: 20,
  fontWeight: "700",
  marginTop: 10,
},

authorText: {
  fontSize: 16,
  color: "#426A80",
  marginTop: 5,
},

categoryText: {
  color: "#777",
  marginTop: 4,
},

infoRow: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: 20,
},

infoItem: {
  alignItems: "center",
},

infoLabel: {
  color: "#777",
},

infoValue: {
  color: "#8A5A1F",
  fontWeight: "600",
  marginTop: 5,
},

buttonRow: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: 20,
},

saveBtn: {
  backgroundColor: "#426A80",
  paddingVertical: 12,
  paddingHorizontal: 40,
  borderRadius: 25,
},
avatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 10,
},
modalOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  width: "80%",
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 20,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "600",
},
});