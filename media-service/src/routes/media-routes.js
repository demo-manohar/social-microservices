const express = require("express");
const router = express.Router();
const { uploadMedia, getAllMedia } = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authmiddleware");
const multer = require("multer");
const logger = require("../utils/logger");

// configure multer for file upload
// Store incoming file in memory so the controller can upload `req.file.buffer` to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
}).single("file");
router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error:", err.message);
        return res
          .status(400)
          .json({ message: "Error uploading file", error: err.message });
      } else if (err) {
        logger.error("Unknown error:", err.message);
        return res
          .status(400)
          .json({ message: "Error uploading file", error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      next();
    });
  },
  uploadMedia,
);
router.get("/",authenticateRequest, getAllMedia);
module.exports = router;
