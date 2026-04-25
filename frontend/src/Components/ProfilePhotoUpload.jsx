/**
 * ProfilePhotoUpload
 * ────────────────────────────────────────────────
 * Click-to-upload avatar with preview and Cloudinary save.
 * Props:
 *   user        — current user object (needs profilePhoto.url)
 *   accentColor — "sky" | "emerald" | "violet"
 *   onUploaded  — (profilePhoto) => void  called after successful upload
 */
import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { PiCamera, PiCircleNotch } from "react-icons/pi";

const ProfilePhotoUpload = ({ user, accentColor = "sky", onUploaded }) => {
  const [preview,   setPreview]   = useState(user?.profilePhoto?.url || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const ring = {
    sky:    "ring-sky-500",
    emerald:"ring-emerald-500",
    violet: "ring-violet-500",
  }[accentColor] || "ring-sky-500";

  const btnBg = {
    sky:    "bg-sky-500 hover:bg-sky-400",
    emerald:"bg-emerald-500 hover:bg-emerald-400",
    violet: "bg-violet-500 hover:bg-violet-400",
  }[accentColor] || "bg-sky-500";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB."); return;
    }

    // Read as base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      setUploading(true);
      try {
        const res = await axios.post(
          "http://localhost:4000/api/v1/user/upload-photo",
          { photo: base64 },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
        toast.success("Profile photo updated!");
        if (onUploaded) onUploaded(res.data.profilePhoto);
      } catch (err) {
        toast.error(err.response?.data?.message || "Upload failed.");
        setPreview(user?.profilePhoto?.url || null); // revert preview
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar */}
      <div className={`relative w-24 h-24 rounded-2xl ring-2 ${ring} ring-offset-2 ring-offset-slate-900 overflow-hidden`}>
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover"/>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br ${
            accentColor === "sky" ? "from-sky-400 to-sky-600" :
            accentColor === "emerald" ? "from-emerald-400 to-emerald-600" :
            "from-violet-400 to-violet-600"
          }`}>
            {initials}
          </div>
        )}
        {/* Upload overlay */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-100"
        >
          {uploading
            ? <PiCircleNotch size={22} className="text-white animate-spin"/>
            : <PiCamera size={22} className="text-white"/>
          }
        </button>
      </div>

      {/* Button */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${btnBg} text-white text-xs font-bold transition-all disabled:opacity-50`}
      >
        {uploading ? <><PiCircleNotch size={13} className="animate-spin"/> Uploading…</> : <><PiCamera size={13}/> {preview ? "Change Photo" : "Upload Photo"}</>}
      </button>
      <p className="text-slate-600 text-[10px]">JPG, PNG · Max 5 MB</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

export default ProfilePhotoUpload;
