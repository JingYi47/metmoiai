import multer from "multer";

const storage = multer.memoryStorage();

export const uploadCategory = multer({ storage });
