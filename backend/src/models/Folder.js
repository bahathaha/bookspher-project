import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  books: [
    {
      title: String,
      authors: String,
      thumbnail: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;