import { useState } from "react";
import { PiX } from "react-icons/pi";

const CATEGORIES = ["Discussion", "Question", "Announcement"];

const CreatePostModal = ({ onClose }) => {
  const [category, setCategory] = useState("Discussion");
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");

  const handlePublish = () => {
    /* 🔴 BACKEND INTEGRATION (LATER)
       POST /api/forum/posts
       body: { category, title, content }
    */
    console.log({ category, title, content });
    onClose();
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-white font-bold text-base">Create New Post</h2>
            <p className="text-slate-500 text-xs mt-0.5">Share thoughts, ask questions, or announce</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <PiX size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">

          {/* Category chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === c
                      ? "bg-sky-500 text-white shadow shadow-sky-500/30"
                      : "bg-slate-800 text-slate-400 border border-white/[0.07] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Title</label>
            <input
              type="text"
              placeholder="Enter a clear, descriptive title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Content</label>
            <textarea
              rows={4}
              placeholder="Share your thoughts, questions, or announcement…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:text-white hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold tracking-wide transition-all shadow shadow-sky-500/30 hover:-translate-y-0.5"
          >
            Publish Post
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePostModal;
