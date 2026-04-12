import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload
export const uploadImage = (buffer, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

//DELETE
export const deleteImage = async (publicId) => {
  if (!publicId) {
    console.log("⚠️ Không có public_id → bỏ qua cloud");
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId);

  console.log("🔥 Cloudinary delete:", result);

  return result;
};
