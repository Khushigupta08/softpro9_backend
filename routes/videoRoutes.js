const express = require("express");
const router = express.Router();
const Video = require("../models/Video");

// This route should be moved to courseRoutes as it relates to 'courses'
router.get('/:courseId/videos', async (req, res) => {
  const userId = req.user?.id; // From auth middleware
  const courseId = req.params.courseId;

  // Check if user purchased the course
  const purchased = await db.get(
    `SELECT COUNT(*) as count FROM purchases WHERE user_id = ? AND course_id = ? AND payment_status = 'completed'`,
    [userId, courseId]
  );

  const videos = await db.all(
    `SELECT id, title, video_url, moduleName, topicName FROM videos WHERE course_id = ?`,
    [courseId]
  );

  const videoList = videos.map(video => ({
    ...video,
    locked: !purchased.count
  }));

  res.json(videoList);
});

// Add a new video - POST /api/videos
router.post('/', async (req, res) => {
  const { courseId, moduleName, topicName, title, video_url } = req.body;

  if (!courseId || !moduleName || !title || !video_url) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    await Video.create({ courseId, moduleName, topicName, title, video_url });
    res.json({ success: true, message: "Video added" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add video", error: err.message });
  }
});

// Edit a video - PUT /api/videos/:videoId
router.put('/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const { title, video_url, moduleName, topicName } = req.body;

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    await video.update({ title, video_url, moduleName, topicName });
    res.json({ success: true, message: "Video updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
});

// Delete a video - DELETE /api/videos/:videoId
router.delete('/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const deleted = await Video.destroy({ where: { id: videoId } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
});
module.exports = router;
