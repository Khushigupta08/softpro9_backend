const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/admin/User");

const router = express.Router();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "default_admin_secret";

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    // Prevent arbitrary self-assignment of 'admin' role without secret key
    let assignedRole = 'developer';
    if (role === 'admin') {
      const adminCreateKey = process.env.ADMIN_CREATE_KEY;
      if (!adminCreateKey || req.body.adminKey !== adminCreateKey) {
        return res.status(403).json({ message: 'Admin creation not allowed without valid key' });
      }
      assignedRole = 'admin';
    }

    const user = await User.create({ username, password: hashed, role: assignedRole });

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

  // Increase admin token lifetime to 7 days to reduce frequent expiration during use
  const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      ADMIN_JWT_SECRET,
      { expiresIn: "7d" }
  );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

module.exports = router;
