const express = require("express");
const Blog = require("../models/Blog");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// -------------------- Create Blog --------------------
router.post("/", upload.single("imgFile"), async (req, res) => {
  try {
    const { title, category, tag, color, imgUrl, excerpt,createdBy, createdAt } = req.body;

    // If file is uploaded, save path
    const imgFile = req.file ? req.file.filename : null;

    const blog = await Blog.create({
      title,
      category,
      tag,
      color,
      imgUrl: imgUrl || null,
      imgFile,
      excerpt,
      createdBy,
      createdAt
    });

    res.json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- Get All Blogs --------------------
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.findAll();
    console.log("Blogs fetched:", blogs);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Get Blog by Slug --------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ where: { slug: req.params.slug } });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------- Update Blog --------------------
router.put("/:id", upload.single("imgFile"), async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const { title, category, tag, color, imgUrl, excerpt ,createdBy,createdAt} = req.body;
    const imgFile = req.file ? req.file.filename : blog.imgFile;

    await blog.update({
      title,
      category,
      tag,
      color,
      imgUrl: imgUrl || null,
      imgFile,
      excerpt,
      createdBy,
      createdAt
    });

    res.json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- Delete Blog --------------------
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await blog.destroy();
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
