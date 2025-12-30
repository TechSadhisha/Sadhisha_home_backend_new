import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  // automagically handled if env var is set, but explicit config ensures it
  // actually, cloudinary.config() might need to be called to set secure
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const ASSETS_DIR = path.resolve(__dirname, "../sadhisha-frontend/src/assets");
const OUTPUT_FILE = path.resolve(__dirname, "uploaded_assets.json");

const uploadedAssets = {};

async function uploadFile(filePath) {
  let resourceType = "auto";
  const ext = path.extname(filePath).toLowerCase();

  // Explicitly set resource_type for some extensions if needed
  // 'auto' works for image and video.

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false, // Keep original name if possible
      overwrite: true, // Overwrite to ensure we get the latest
      folder: "sadhisha_assets", // Group them in a folder
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

async function processDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory not found: ${directory}`);
    return;
  }

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      // Check extension
      const ext = path.extname(file).toLowerCase();
      // Add more extensions if needed
      if (
        [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".svg",
          ".webp",
          ".avif",
          ".mp4",
          ".mov",
          ".webm",
          ".m4v",
        ].includes(ext)
      ) {
        console.log(`Uploading ${file}...`);
        const url = await uploadFile(fullPath);
        if (url) {
          // Store relative path from frontend root
          const relativePath = path.relative(
            path.resolve(__dirname, "../sadhisha-frontend"),
            fullPath
          );
          // Normalize separators for JSON consistency
          const normalizedPath = relativePath.split(path.sep).join("/");
          uploadedAssets[normalizedPath] = url;
          console.log(`Uploaded: ${url}`);
        }
      }
    }
  }
}

async function main() {
  console.log("Starting Cloudinary upload...");

  // Debug: print contents of env (masking secrets)
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "Not Set");
  console.log(
    "API Key:",
    process.env.CLOUDINARY_API_KEY ? "******" : "Not Set"
  );

  await processDirectory(ASSETS_DIR);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uploadedAssets, null, 2));
  console.log(`Done. Map saved to ${OUTPUT_FILE}`);
}

main();
