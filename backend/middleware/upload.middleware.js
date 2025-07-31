import multer from "multer";
import path from "path";
import fs from "fs";

// Temporary uploads folder
const uploadDir = "uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `image-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
