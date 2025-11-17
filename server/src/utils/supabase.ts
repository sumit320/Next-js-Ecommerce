import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || "products";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file"
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to upload file buffer to Supabase Storage
export const uploadToSupabase = async (
  fileBuffer: Buffer,
  originalname: string,
  contentType?: string
): Promise<string> => {
  const path = require("path");
  
  // Generate unique filename using uuid
  const fileExt = path.extname(originalname);
  const filename = `${uuid()}${fileExt}`;

  // Detect content type from file extension if not provided
  if (!contentType) {
    const ext = fileExt.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    contentType = contentTypes[ext] || "image/jpeg";
  }

  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .upload(filename, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  // Note: The bucket must be public for this URL to work
  // If bucket is private, you'll need to use signed URLs instead
  const {
    data: { publicUrl },
  } = supabase.storage.from(supabaseBucket).getPublicUrl(data.path);

  console.log(`Uploaded file: ${filename}, Public URL: ${publicUrl}`);
  
  return publicUrl;
};

// Helper function to check if a file exists in Supabase Storage
export const checkImageExists = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the Supabase public URL
    // URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[file-path]
    const urlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const match = imageUrl.match(urlPattern);
    
    if (!match) {
      console.warn(`Invalid Supabase URL format: ${imageUrl}`);
      return false;
    }
    
    const bucketName = match[1];
    const filePath = match[2];
    
    // Try to download the file to check if it exists
    // If the file doesn't exist, this will return an error
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      // File doesn't exist or there's an access issue
      console.warn(`Image does not exist or cannot be accessed: ${imageUrl} - ${error.message}`);
      return false;
    }
    
    // If we got data, the file exists
    return data !== null;
  } catch (error) {
    console.error(`Error checking image existence: ${error}`);
    return false;
  }
};

// Helper function to delete file from Supabase Storage
export const deleteFromSupabase = async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract the file path from the Supabase public URL
    // URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[file-path]
    const urlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const match = imageUrl.match(urlPattern);
    
    if (!match) {
      const errorMsg = `Invalid Supabase URL format: ${imageUrl}`;
      console.warn(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    const bucketName = match[1];
    const filePath = match[2];
    
    console.log(`Deleting file from Supabase: bucket=${bucketName}, path=${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      const errorMsg = `Failed to delete file from Supabase: ${error.message}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    console.log(`Successfully deleted file: ${filePath} from bucket: ${bucketName}`);
    return { success: true };
  } catch (error: any) {
    const errorMsg = `Error deleting file from Supabase: ${error?.message || error}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

