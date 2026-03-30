import mongoose from "mongoose";
import fs from "fs";
import Book from "./models/Book.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/booksphere";

const importData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    const data = JSON.parse(
      fs.readFileSync("./src/data/books.json", "utf-8")
    );

    // Clear old data
    await Book.deleteMany();

    // Insert new data
    await Book.insertMany(data);

    console.log("🎉 Books Imported Successfully");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();