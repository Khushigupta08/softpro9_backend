const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require('cors');
const hrEmailRoutes = require('./routes/hrEmails');
const consultationRoutes = require('./routes/consultations');
const sequelize = require('./config/db');

const app = express();

// Enable CORS for development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Connect to database
sequelize.authenticate()
  .then(() => {
    console.log('Connected to database successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// API Routes
app.use('/api/hr-emails', hrEmailRoutes);
app.use('/api/consultations', consultationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'An internal server error occurred' });
});

// Dummy DB (use real SQLite later)
const db = {
  getCourseBySlug: async (slug) => ({ title: "React Development Course", shortDescription: "Learn React from scratch" }),
  getBlogBySlug: async (slug) => ({ title: "Top 10 Web Development Tips", shortDescription: "Enhance your skills with these tips" }),
};
const buildPath = path.join(__dirname, "../softpro9/build");

// Serve static files from /Softpro9 prefix first
app.use('/Softpro9', express.static(buildPath, { maxAge: 0 }));

const staticMeta = {
  "/": { title: "Home - EduSite", description: "Learn online with top tutorials" },
  "/about": { title: "About Us - EduSite", description: "Know more about our platform" },
  "/contact": { title: "Contact Us - EduSite", description: "Get in touch with our team" },
  "/academy": { title: "Academy - EduSite", description: "Explore our academy programs" },
  "/service": { title: "Services - EduSite", description: "Check our services" },
  "/courselist": { title: "All Courses - EduSite", description: "Browse all our courses" },
  "/industry": { title: "Industries - EduSite", description: "Learn about industries" },
  "/career": { title: "Career - EduSite", description: "Join our team" },
  "/web": { title: "Web Services - EduSite", description: "Our web development services" },
  "/sap": { title: "SAP Services - EduSite", description: "SAP consulting services" },
  "/digital": { title: "Digital Marketing - EduSite", description: "Grow online with us" },
  "/recruitment": { title: "Recruitment - EduSite", description: "Explore job opportunities" },
  "/policy": { title: "Privacy Policy - EduSite", description: "Our privacy policies" },
  "/conditions": { title: "Terms & Conditions - EduSite", description: "Read our terms" },
  "/refund": { title: "Refund Policy - EduSite", description: "Refund information" },
  "/faq": { title: "FAQ - EduSite", description: "Frequently asked questions" },
};

// Catch-all route for any route under /Softpro9, to serve React app with dynamic meta tags
app.get('/Softpro9/*', async (req, res) => {
  console.log("process.cwd() is:", process.cwd());
  console.log("__dirname is:", __dirname);
  console.log("buildPath is:", buildPath);
  console.log("Trying to read index.html from:", path.join(buildPath, "index.html"));

  const filePath = path.join(buildPath, "index.html");

  fs.readFile(filePath, "utf8", async (err, htmlData) => {
    if (err) {
      console.error("Error reading index.html:", err);
      return res.status(500).send("Error reading index.html");
    }

    let title = "EduSite";
    let description = "Online learning platform";

    // Extract React app route after /Softpro9 base path
    const reactRoute = req.path.replace(/^\/Softpro9/, '') || '/';

    // Clean trailing slash, except if route is just "/"
    const cleanPath = reactRoute.endsWith("/") && reactRoute.length > 1
      ? reactRoute.slice(0, -1)
      : reactRoute;

    if (reactRoute.startsWith("/course/")) {
      const slug = reactRoute.split("/course/")[1];
      const course = await db.getCourseBySlug(slug);
      if (course && course.title && course.shortDescription) {
        title = `${course.title} - EduSite`;
        description = course.shortDescription;
      }
    } else if (reactRoute.startsWith("/blogs/")) {
      const slug = reactRoute.split("/blogs/")[1];
      const blog = await db.getBlogBySlug(slug);
      if (blog && blog.title && blog.shortDescription) {
        title = `${blog.title} - EduSite`;
        description = blog.shortDescription;
      }
    } else if (staticMeta[cleanPath]) {
      title = staticMeta[cleanPath].title;
      description = staticMeta[cleanPath].description;
    }

    console.log(`Serving page for path: ${reactRoute} with title: ${title}`);
   
    htmlData = htmlData
      .replace(/<title>.*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);

    res.send(htmlData);
  });
});

// Optionally, handle favicon.ico to avoid 500 errors
app.use('/favicon.ico', express.static(path.join(__dirname, '../softpro9/public/favicon.ico')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running successfully on port ${PORT}`);
  console.log('API Routes available:');
  console.log('- GET    /api/hr-emails');
  console.log('- POST   /api/hr-emails');
  console.log('- PUT    /api/hr-emails/:id');
  console.log('- DELETE /api/hr-emails/:id');
  console.log('- GET    /api/consultations');
  console.log('- POST   /api/consultations');
  console.log('- PATCH  /api/consultations/:id');
});
