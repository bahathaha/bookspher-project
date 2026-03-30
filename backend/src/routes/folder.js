// routes/folder.js
import express from "express";
import Folder from "../models/Folder.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// CREATE FOLDER
router.post("/", protectRoute, async (req, res) => {
  try {
    const folder = await Folder.create({
      userId: req.user._id,
      name: req.body.name,
    });

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// GET USER FOLDERS
router.get("/", protectRoute, async (req, res) => {
  const folders = await Folder.find({ userId: req.user._id });
  res.json(folders);
});
router.post("/add-book", protectRoute, async (req, res) => {
  const { folderId, book } = req.body;

  const folder = await Folder.findById(folderId);

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  folder.books.push(book);
  await folder.save();

  res.json({ message: "Book added" });
});
export default router;