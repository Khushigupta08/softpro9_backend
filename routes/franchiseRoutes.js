const express = require("express");
const router = express.Router();
const Franchise = require("../models/Franchise");
const {
  sendFranchiseConfirmationEmail,
  sendFranchiseAdminNotification,
} = require("../utils/emailService");

// POST: Submit franchise application
router.post("/submit", async (req, res) => {
  try {
    const { name, mobile, email, city, interested } = req.body;

    if (!name || !mobile || !email || !city || !interested) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10 digits",
      });
    }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const franchiseData = {
      name,
      mobile,
      email,
      city,
      interested,
      ip,
    };

    // Sequelize create
    const newFranchise = await Franchise.create(franchiseData);

    try {
      await sendFranchiseConfirmationEmail(email, name);
      await sendFranchiseAdminNotification(franchiseData);
    } catch (emailError) {
      console.error("❌ Email error:", emailError);
    }

    res.status(201).json({
      success: true,
      message:
        "Franchise application submitted successfully! We will contact you soon.",
      data: newFranchise,
    });
  } catch (error) {
    console.error("❌ Error submitting franchise:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit franchise application",
    });
  }
});

// GET: Get all franchises (Admin)
router.get("/all", async (req, res) => {
  try {
    const franchises = await Franchise.findAll({
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: franchises,
    });
  } catch (error) {
    console.error("❌ Error fetching franchises:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch franchises",
    });
  }
});

// GET: Get franchise stats
router.get("/stats", async (req, res) => {
  try {
    const total = await Franchise.count();
    const pending = await Franchise.count({ where: { status: "pending" } });
    const approved = await Franchise.count({ where: { status: "approved" } });
    const rejected = await Franchise.count({ where: { status: "rejected" } });
    const contacted = await Franchise.count({ where: { status: "contacted" } });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        contacted,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
});

// GET: Get franchise by ID
router.get("/:id", async (req, res) => {
  try {
    const franchise = await Franchise.findByPk(req.params.id);

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    res.json({
      success: true,
      data: franchise,
    });
  } catch (error) {
    console.error("❌ Error fetching franchise:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch franchise",
    });
  }
});

// PUT: Update franchise status
router.put("/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    const validStatuses = ["pending", "contacted", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const franchise = await Franchise.findByPk(id);
    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    await franchise.update({
      status,
      notes: notes || "",
      updated_at: new Date(),
    });

    res.json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
});

// DELETE: Delete franchise
router.delete("/:id", async (req, res) => {
  try {
    const franchise = await Franchise.findByPk(req.params.id);
    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    await franchise.destroy();

    res.json({
      success: true,
      message: "Franchise deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting franchise:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete franchise",
    });
  }
});

module.exports = router;
