import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    // --- Existing Fields ---
    isbn13: String,
    title: String,
    subtitle: String,
    authors: String,
    categories: String,
    thumbnail: String,
    description: String,
    published_year: Number,
    average_rating: Number,
    num_pages: Number,
    ratings_count: Number,

    // 🔴 ADD THIS FIELD (Crucial for Profile)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- Social Fields ---
    wishlistUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    wishlistCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
); // ✅ Recommended: adds createdAt for sorting

export default mongoose.model('Book', BookSchema);
