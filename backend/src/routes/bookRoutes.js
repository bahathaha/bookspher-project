import express from 'express';
import Book from '../models/Book.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// ==========================================
// 🏠 GET ALL BOOKS (Home / Explore Screen)
// ==========================================
router.get('/public', async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name profileImage');

    res.json({ books });
  } catch (error) {
    console.log('Fetch home books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// 👤 GET MY BOOKS (Profile Screen)
// ==========================================
router.get('/', protectRoute, async (req, res) => {
  try {
    const myBooks = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ books: myBooks });
  } catch (error) {
    console.log('Fetch profile books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// ✍️ CREATE BOOK
// ==========================================
router.post('/', protectRoute, async (req, res) => {
  try {
    const { title, authors, categories, image, thumbnail, description } =
      req.body;

    const newBook = new Book({
      title: title || 'Untitled Plan',
      authors: authors || req.user.name || 'Anonymous',
      categories: categories || 'Personal',
      description: description || 'No description provided.',
      thumbnail: image || thumbnail || 'https://via.placeholder.com/150',
      user: req.user._id, // ✅ correct
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    console.log('Create book error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ⭐ WISHLIST TOGGLE (FINAL FIXED)
// ==========================================
router.post('/:id/wishlist', protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ message: 'Invalid Book ID' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // ✅ ensure fields exist
    if (!book.wishlistUsers) book.wishlistUsers = [];
    if (book.wishlistCount === undefined) book.wishlistCount = 0;

    // ✅ FIX ObjectId comparison
    const isWishlisted = book.wishlistUsers.some(
      id => id.toString() === userId.toString(),
    );

    if (isWishlisted) {
      book.wishlistUsers = book.wishlistUsers.filter(
        id => id.toString() !== userId.toString(),
      );
      book.wishlistCount = Math.max(0, book.wishlistCount - 1);
    } else {
      book.wishlistUsers.push(userId);
      book.wishlistCount += 1;
    }

    // ✅ CRITICAL FIX → skip validation (fixes user required error)
    await book.save({ validateBeforeSave: false });

    res.json({
      success: true,
      isWishlisted: !isWishlisted,
      count: book.wishlistCount,
    });
  } catch (error) {
    console.log('Wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// 📚 GET MY WISHLIST
// ==========================================
router.get('/wishlist', protectRoute, async (req, res) => {
  try {
    const wishlistBooks = await Book.find({
      wishlistUsers: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ books: wishlistBooks });
  } catch (error) {
    console.log('Fetch wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, filter } = req.query;

    if (!q) return res.json({ books: [] });

    let searchQuery = {};

    // 🔥 Writer → search by author
    if (filter === 'Writer') {
      searchQuery = {
        authors: { $regex: q, $options: 'i' },
      };
    }

    // 🔥 Novel → search by title (ALL books)
    else {
      searchQuery = {
        title: { $regex: q, $options: 'i' },
      };
    }

    const books = await Book.find(searchQuery).limit(20);

    res.json({ books });
  } catch (error) {
    console.log('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
