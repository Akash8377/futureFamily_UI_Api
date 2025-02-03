const multer = require("multer");
const path = require("path");

const maxSize = 2 * 1024 * 1024; // 2MB

// Configure storage
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = ["image/jpeg", "image/png", "image/gif","application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only images (JPEG, PNG, GIF) are allowed"), false);
  }
  cb(null, true);
};

// Upload middleware
let uploadFile = multer({ 
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: fileFilter,
}).single("file");

module.exports = uploadFile;
