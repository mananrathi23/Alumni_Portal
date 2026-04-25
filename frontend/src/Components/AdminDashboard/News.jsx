import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  PiNewspaper, PiPlus, PiTrash, PiPencilSimple,
  PiCheck, PiX, PiCalendar,
} from "react-icons/pi";

const BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1/news`;

const EMPTY = { title: "", description: "", date: "" };

const AdminNews = () => {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);   // null = create mode
  const [saving,  setSaving]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE, { withCredentials: true });
      setNews(res.data.news || []);
    } catch {
      toast.error("Failed to load news.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      title:       item.title,
      description: item.description,
      date:        item.date ? item.date.slice(0, 10) : "",
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${BASE}/${editId}`, form, { withCredentials: true });
        toast.success("News updated.");
      } else {
        await axios.post(BASE, form, { withCredentials: true });
        toast.success("News posted.");
      }
      cancelForm();
      fetchNews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving news.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/${id}`, { withCredentials: true });
      toast.success("News deleted.");
      setNews((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleting(null);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PiNewspaper className="text-rose-400" /> News & Announcements
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Posts appear as a scrolling ticker on the public homepage.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-all shadow shadow-rose-500/20"
          >
            <PiPlus size={16} /> Post News
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-900 border border-rose-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">
              {editId ? "Edit Announcement" : "New Announcement"}
            </p>
            <button onClick={cancelForm} className="text-slate-400 hover:text-white">
              <PiX size={18} />
            </button>
          </div>

          <div>
            <label className={lbl}>Title *</label>
            <input
              type="text"
              placeholder="e.g. Campus Recruitment Drive 2026"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={inp}
              maxLength={200}
            />
          </div>

          <div>
            <label className={lbl}>Description *</label>
            <textarea
              rows={4}
              placeholder="Write the full announcement here…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={`${inp} resize-none`}
              maxLength={2000}
            />
            <p className="text-slate-600 text-xs text-right mt-1">{form.description.length}/2000</p>
          </div>

          <div>
            <label className={lbl}>Date (optional)</label>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().slice(0,10)}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={inp}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-all disabled:opacity-50"
            >
              <PiCheck size={15} /> {saving ? "Saving…" : editId ? "Update" : "Publish"}
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* News List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <PiNewspaper className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">No news posted yet. Click "Post News" to add the first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <div
              key={n._id}
              className="bg-slate-900 border border-white/[0.06] rounded-xl p-4 flex items-start gap-4 hover:border-rose-500/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-snug">{n.title}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{n.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                  <PiCalendar size={11} />
                  {new Date(n.date || n.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(n)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all border border-white/[0.06]"
                  title="Edit"
                >
                  <PiPencilSimple size={14} />
                </button>
                <button
                  onClick={() => handleDelete(n._id)}
                  disabled={deleting === n._id}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/[0.06] disabled:opacity-50"
                  title="Delete"
                >
                  <PiTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNews;
