// ResumeUploader.jsx — PDF resume upload/download/delete widget
// Used inside Student and Alumni profile pages

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  PiFilePdf, PiUploadSimple, PiDownloadSimple,
  PiTrash, PiCircleNotch, PiCheckCircle, PiWarningCircle,
} from "react-icons/pi";

const API = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/resume`;

export default function ResumeUploader({ accentColor = "sky" }) {
  const [resumeMeta, setMeta]   = useState(null);  // { originalName, uploadedAt, hasResume }
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef            = useRef(null);

  const accent = {
    sky:     { ring: "ring-sky-500", bg: "bg-sky-500 hover:bg-sky-400", text: "text-sky-400", border: "border-sky-500/30 bg-sky-500/5" },
    emerald: { ring: "ring-emerald-500", bg: "bg-emerald-500 hover:bg-emerald-400", text: "text-emerald-400", border: "border-emerald-500/30 bg-emerald-500/5" },
    violet:  { ring: "ring-violet-500", bg: "bg-violet-500 hover:bg-violet-400", text: "text-violet-400", border: "border-violet-500/30 bg-violet-500/5" },
  }[accentColor] || { ring: "ring-sky-500", bg: "bg-sky-500 hover:bg-sky-400", text: "text-sky-400", border: "border-sky-500/30 bg-sky-500/5" };

  const fetchMeta = async () => {
    try {
      const res = await axios.get(`${API}/me`, { withCredentials: true });
      setMeta(res.data.resume);
    } catch { setMeta(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeta(); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("resume", file);

    try {
      await axios.post(`${API}/upload`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Resume uploaded successfully!");
      await fetchMeta();
    } catch(e) {
      toast.error(e.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const download = async () => {
    try {
      const res = await axios.get(`${API}/download`, {
        withCredentials: true,
        responseType:    "blob",
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.download = resumeMeta?.originalName || "resume.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed."); }
  };

  const remove = async () => {
    if (!window.confirm("Delete your resume? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await axios.delete(API, { withCredentials: true });
      setMeta(null);
      toast.success("Resume deleted.");
    } catch { toast.error("Delete failed."); }
    finally { setDeleting(false); }
  };

  // Drag-and-drop handlers
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PiFilePdf size={18} className="text-red-400"/>
        <div>
          <p className="text-white font-semibold text-sm">Resume / CV</p>
          <p className="text-slate-500 text-xs">PDF only · Max 5 MB</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <PiCircleNotch size={16} className="animate-spin"/> Loading…
        </div>
      ) : resumeMeta?.hasResume ? (
        // ── Existing resume ──────────────────────────────────────────────────
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/[0.06]">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <PiFilePdf size={18} className="text-red-400"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{resumeMeta.originalName || "resume.pdf"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PiCheckCircle size={12} className="text-emerald-400"/>
                <p className="text-slate-500 text-xs">
                  Uploaded {resumeMeta.uploadedAt
                    ? new Date(resumeMeta.uploadedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={download}
              className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow ${accent.bg}`}>
              <PiDownloadSimple size={15}/> Download
            </button>
            <button onClick={remove} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
              {deleting ? <PiCircleNotch size={14} className="animate-spin"/> : <PiTrash size={14}/>}
            </button>
          </div>

          {/* Allow re-upload */}
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-400 text-xs font-medium hover:text-white hover:bg-slate-700 transition-all">
            Replace with a new PDF
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}/>
        </div>
      ) : (
        // ── Upload zone ──────────────────────────────────────────────────────
        <div>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver
                ? `${accent.border} border-opacity-100 scale-[1.01]`
                : "border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50"
            }`}>
            {uploading ? (
              <>
                <PiCircleNotch size={28} className={`${accent.text} animate-spin`}/>
                <p className="text-slate-400 text-sm font-medium">Uploading…</p>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dragOver ? accent.border : "bg-slate-800"}`}>
                  <PiUploadSimple size={22} className={dragOver ? accent.text : "text-slate-500"}/>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${dragOver ? accent.text : "text-slate-300"}`}>
                    {dragOver ? "Drop your PDF here" : "Upload your Resume"}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Drag & drop or click to browse</p>
                </div>
                <p className="text-slate-600 text-[10px]">PDF · Max 5 MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}/>
        </div>
      )}
    </div>
  );
}
