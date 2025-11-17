import multer from "multer";

// Configure memory storage to use file.buffer instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fieldSize: 1024 * 1024 * 5 },
});
