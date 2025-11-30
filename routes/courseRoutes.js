const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const Video = require("../models/Video");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Utility slugify function
function slugify(title) {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ✅ Normalize course data function
function normalizeCourseData(courseData) {
  if (!courseData) return null;
  
  const normalized = courseData.toJSON ? courseData.toJSON() : { ...courseData };
  
  // Normalize learn field - convert object to array
  if (normalized.learn && !Array.isArray(normalized.learn)) {
    if (typeof normalized.learn === 'string') {
      try {
        normalized.learn = JSON.parse(normalized.learn);
      } catch (e) {
        normalized.learn = [];
      }
    }
    
    if (normalized.learn && typeof normalized.learn === 'object' && !Array.isArray(normalized.learn)) {
      normalized.learn = Object.entries(normalized.learn).map(([key, value], index) => ({
        icon: 'star',
        title: `Learning Module ${index + 1}`,
        content: value
      }));
    }
  }
  
  if (!Array.isArray(normalized.learn)) {
    normalized.learn = [];
  }
  
  // Normalize features field
  if (normalized.features) {
    if (typeof normalized.features === 'string') {
      try {
        normalized.features = JSON.parse(normalized.features);
      } catch (e) {
        normalized.features = [];
      }
    }
    if (typeof normalized.features === 'object' && !Array.isArray(normalized.features)) {
      normalized.features = Object.values(normalized.features);
    }
  }
  
  if (!Array.isArray(normalized.features)) {
    normalized.features = [];
  }
  
  return normalized;
}

// GET all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.findAll();
    
    const result = courses.map(c => {
      const obj = c.toJSON();
      ['mode', 'syllabus', 'features', 'learn'].forEach(key => {
        if (typeof obj[key] === 'string') {
          try {
            obj[key] = JSON.parse(obj[key]);
          } catch (e) {
            obj[key] = null;
          }
        }
      });
      return obj;
    });
    
    res.json(result);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// GET course by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const course = await Course.findOne({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: "Course not found" });
    const normalizedCourse = normalizeCourseData(course);
    res.json(normalizedCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const normalizedCourse = normalizeCourseData(course);
    res.json(normalizedCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add course
router.post("/", upload.fields([
  { name: "backgroundImageFile", maxCount: 1 },
  { name: "descriptionFile", maxCount: 1 }
]), async (req, res) => {
  try {
    let data = req.body;
    let slug = slugify(data.title);
    const exists = await Course.findOne({ where: { slug } });
    if (exists) slug += "-" + Date.now();
    data.slug = slug;

    const price = parseFloat(data.price);
    data.price = isNaN(price) ? 0 : price;
    const discountPercent = parseFloat(data.discountPercent);
    data.discountPercent = isNaN(discountPercent) ? 0 : discountPercent;
    const gstPercent = parseFloat(data.gstPercent);
    data.gstPercent = isNaN(gstPercent) ? 18 : gstPercent;

    const discountedPrice = data.price - (data.price * (data.discountPercent / 100));
    const discountPrice = discountedPrice + (discountedPrice * (data.gstPercent / 100));
    data.discountPrice = discountPrice;

    if (req.files && req.files["backgroundImageFile"] && req.files["backgroundImageFile"][0]) {
      data.backgroundImageUrl = req.files["backgroundImageFile"][0].path;
    } else if (data.backgroundImageUrl) {
      data.backgroundImageUrl = data.backgroundImageUrl || null;
    }

    if (req.files && req.files["descriptionFile"] && req.files["descriptionFile"][0]) {
      const filePath = req.files["descriptionFile"][0].path;
      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".pdf") {
        const buffer = fs.readFileSync(filePath);
        const pdfParse = await import("pdf-parse").then(mod => mod.default);
        const pdfData = await pdfParse(buffer);
        data.description = pdfData.text;
      } else if (ext === ".docx" || ext === ".doc") {
        const text = await new Promise((resolve, reject) => {
          textract.fromFileWithPath(filePath, (err, text) => {
            if (err) reject(err);
            else resolve(text);
          });
        });
        data.description = text;
      } else {
        data.description = fs.readFileSync(filePath, "utf-8");
      }
    }

    ["mode", "syllabus", "features", "learn"].forEach(key => {
      if (typeof data[key] === "string") {
        try {
          data[key] = JSON.parse(data[key]);
        } catch {}
      }
    });

    const course = await Course.create(data);
    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(400).json({ error: err.message || "Creation failed" });
  }
});

// PUT edit course
router.put("/:id", upload.fields([
  { name: "backgroundImageFile", maxCount: 1 },
  { name: "descriptionFile", maxCount: 1 }
]), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    let data = req.body;

    if (data.title && data.title !== course.title) {
      let slug = slugify(data.title);
      const exists = await Course.findOne({
        where: { slug, id: { [Op.ne]: req.params.id } }
      });
      if (exists) slug += "-" + Date.now();
      data.slug = slug;
    }

    const price = parseFloat(data.price);
    data.price = isNaN(price) ? course.price || 0 : price;

    const discountPercent = parseFloat(data.discountPercent);
    data.discountPercent = isNaN(discountPercent) ? (course.discountPercent || 0) : discountPercent;

    const gstPercent = parseFloat(data.gstPercent);
    data.gstPercent = isNaN(gstPercent) ? (course.gstPercent || 18) : gstPercent;

    const discountedPrice = data.price - (data.price * (data.discountPercent / 100));
    const discountPrice = discountedPrice + (discountedPrice * (data.gstPercent / 100));
    data.discountPrice = discountPrice;

    if (req.files && req.files["backgroundImageFile"] && req.files["backgroundImageFile"][0]) {
      data.backgroundImageUrl = req.files["backgroundImageFile"][0].path;
    } else if (typeof data.backgroundImageUrl === "string") {
      data.backgroundImageUrl = data.backgroundImageUrl || null;
    }

    if (req.files && req.files["descriptionFile"] && req.files["descriptionFile"][0]) {
      const filePath = req.files["descriptionFile"][0].path;
      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".pdf") {
        const buffer = fs.readFileSync(filePath);
        const pdfParse = await import("pdf-parse").then(mod => mod.default);
        const pdfData = await pdfParse(buffer);
        data.description = pdfData.text;
      } else if (ext === ".docx" || ext === ".doc") {
        const text = await new Promise((resolve, reject) => {
          textract.fromFileWithPath(filePath, (err, text) => {
            if (err) reject(err);
            else resolve(text);
          });
        });
        data.description = text;
      } else {
        data.description = fs.readFileSync(filePath, "utf-8");
      }
    }

    ["mode", "syllabus", "features", "learn"].forEach(key => {
      if (typeof data[key] === "string") {
        try {
          data[key] = JSON.parse(data[key]);
        } catch {}
      }
    });

    await course.update(data);
    res.json(course);

  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: err.message || "Update failed" });
  }
});

// DELETE course
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Course.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET videos associated with a course
router.get("/:courseId/videos", async (req, res) => {
  const userId = req.user?.id;
  const courseId = req.params.courseId;

  try {
    const videos = await Video.findAll({
      where: { courseId },
      attributes: ["id", "title", "video_url", "moduleName", "topicName"]
    });

    const videoList = videos.map(video => ({
      ...video.toJSON(),
      locked: false
    }));

    res.json(videoList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET related courses with normalization
router.get("/:id/related", async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const limit = Number(req.query.limit) || 3;

    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    // Fetch related courses
    const related = await Course.findRelated(courseId, limit);
    
    // Check if the base course exists
    const baseCourse = await Course.findByPk(courseId, { attributes: ['id'] });
    if (!baseCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ✅ Normalize each related course
    const normalizedRelated = related.map(course => normalizeCourseData(course));

    return res.json(normalizedRelated);
  } catch (err) {
    console.error('Error fetching related courses:', err);
    return res.status(500).json({ message: 'Failed to fetch related courses' });
  }
});

module.exports = router;