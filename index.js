const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
require("dotenv").config();

const app = express();

// ✅ CORS setup - allow requests from Vercel / any origin in production
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json()); // body parser

// ✅ Import models BEFORE sync
require("./models/BlogCategory");
require("./models/student/User")
require("./models/SavedCourse");
require("./models/Enrollment");
require("./models/Payment");
require("./models/Course");
require("./models/Application");
require("./models/Blog");
require("./models/CourseAccessRequest");
require("./models/CurrentJobs");
require("./models/User");
require("./models/admin/User");
require("./models/Video");
require("./models/Training");
require("./models/Category");
require("./models/Message");
require("./models/Batch");
require("./models/TrainingLocations");
require("./models/ExpertRequest");
require("./models/Franchise");





// Log DB connection method for easier debugging
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/(postgres:\/\/)(.+@)?/, '$1****@');
  console.log('Database config: using DATABASE_URL:', masked);
} else if (process.env.NODE_ENV === 'production') {
  console.log('Database config: NODE_ENV=production, using PG env vars (DB_HOST/DB_PORT/DB_NAME)');
} else {
  console.log('Database config: development mode, using SQLite file:', process.env.DB_FILE || './softpro9.db');
}

// ✅ Database sync (must be before listen)
// Use connectWithRetry helper (attached to exported sequelize instance)
const connectWithRetry = sequelize.connectWithRetry || (async () => {
  // fallback - if helper not present, call sync directly
  await sequelize.sync({ alter: true });
});

connectWithRetry()
  .then(() => {
    console.log("✅ Database connected & synced");

    // ✅ Routes load only after DB sync
    const authRoutes = require("./routes/admin/auth");
    const blogRoutes = require("./routes/blog");
    const trainingRoutes = require("./routes/trainingRoutes");
    const courseRoutes = require("./routes/courseRoutes");
    const categoryRoutes = require("./routes/categoryRoutes");
    const courseAccessRequestsRouter = require("./routes/courseAccessRequests");
    const currentJobs = require("./routes/currentJobs");
    const applicationRoutes = require("./routes/applications");
    const videoRoutes = require("./routes/videoRoutes");
    const blogCategoryRoutes = require("./routes/blogCategoryRoutes");
    const messagesRoutes = require("./routes/messages");
    // const studentAdminRoutes = require("./routes/student/admin");
    const studentAuthRoutes = require("./routes/student/auth");
    const studentAdminStudentsRoutes = require("./routes/student/admin/students");
  const studentEnrollmentFormRoutes = require("./routes/student/enrollmentForm");
  const studentSavedCoursesRoutes = require("./routes/student/savedCourses");
  const batchesRouter = require("./routes/batches");
  const consultationRoutes = require('./routes/consultations');
  const LocationsRoutes = require('./routes/locations');
  const expertRequestsRouter = require('./routes/expertRequests');
  const franchiseRoutes = require('./routes/franchiseRoutes');


    app.use("/api/auth", authRoutes);
    app.use("/api/blogs", blogRoutes);
    app.use("/api/trainings", trainingRoutes);
    app.use("/api/courses", courseRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/access-requests", courseAccessRequestsRouter);
    app.use("/api/jobs", currentJobs);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/videos", videoRoutes);
    app.use("/uploads", express.static("uploads"));
    app.use("/api/blog-category", blogCategoryRoutes);
    app.use("/api/messages", messagesRoutes);
    app.use("/student/auth", studentAuthRoutes);
    // app.use("/student/admin", studentAdminRoutes);
    app.use("/student/admin/students", studentAdminStudentsRoutes);
    app.use("/student/enrollment-form", studentEnrollmentFormRoutes);
    app.use("/student/saved-courses", studentSavedCoursesRoutes);
    app.use("/api/batches", batchesRouter);
    app.use('/api/consultations', consultationRoutes);
    app.use(LocationsRoutes);
    app.use('/api/expert-requests', expertRequestsRouter);
    app.use('/api/franchise', franchiseRoutes);

    // Simple admin endpoints for admin panel
    const simpleAdmin = require('./routes/admin/simpleAdmin');
    app.use('/admin', simpleAdmin);



  // Payments & Enrollments
  const paymentsRoutes = require("./routes/payments");
  const enrollmentsRoutes = require("./routes/enrollments");
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/enrollments", enrollmentsRoutes);


    // Error handler (registered after routes)
    const errorHandler = require('./middleware/errorHandler');
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    // Exit process with failure so Render marks the deploy as failed
    process.exit(1);
  });
