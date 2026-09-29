import { v2 as cloudinary } from "cloudinary";

/**
 * Configure and return cloudinary instance.
 * Called lazily inside functions so dotenv is guaranteed loaded first.
 */
function getConfigured() {
  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey     = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret  = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary env vars missing. Found: cloud_name=${!!cloudName}, api_key=${!!apiKey}, api_secret=${!!apiSecret}. ` +
      `Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to your .env file.`
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

/**
 * Upload a base64 data URI to Cloudinary.
 * Returns { public_id, url } or throws.
 */
export const uploadToCloudinary = async (base64DataUri, folder = "alumni_portal/profiles") => {
  const cl = getConfigured();
  const result = await cl.uploader.upload(base64DataUri, {
    folder,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
    // Ensure CORS headers are set
    resource_type: "auto",
  });
  // Return both secure_url (for CORS compliance) and ensure proper headers
  return { 
    public_id: result.public_id, 
    url: result.secure_url,
    // Add fallback for clients that may have tracking prevention
    fallbackUrl: result.url 
  };
};

/**
 * Delete a previously uploaded image by public_id.
 */
export const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  const cl = getConfigured();
  await cl.uploader.destroy(public_id);
};

export default cloudinary;
