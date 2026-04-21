import { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useSocket } from "../SocketContext";
import {
  PiRocketLaunch, PiPlus, PiX, PiArrowUp, PiChatCircle,
  PiHandshake, PiMagnifyingGlass, PiTrash, PiTag,
  PiLightbulb, PiFlask, PiChartLineUp, PiSparkle,
  PiUser, PiCheck,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/incubation";

const STAGES = [
  { key: "all",       label: "All Stages",  icon: PiSparkle },
  { key: "idea",      label: "Idea",        icon: PiLightbulb },
  { key: "prototype", label: "Prototype",   icon: PiFlask },
  { key: "mvp",       label: "MVP",         icon: PiRocketLaunch },
  { key: "scaling",   label: "Scaling",     icon: PiChartLineUp },
];

const LOOKING_FOR_OPTIONS = [
  "investment", "co-founder", "mentor", "feedback", "developer", "designer", "other",
];

const STAGE_COLORS = {
  idea:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  prototype: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  mvp:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scaling:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const ROLE_COLORS = {
  Student: "bg-sky-500/10 text-sky-400",
  Alumni:  "bg-emerald-500/10 text-emerald-400",
  Teacher: "bg-violet-500/10 text-violet-400",
};

// ── Idea Card ─────────────────────────────────────────────────────────────────
const IdeaCard = ({ idea, currentUserId, accentColor, onRefresh }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [commentText,  setCommentText]  = useState("");
  const [showInterest, setShowInterest] = useState(false);
  const [intType,      setIntType]      = useState("other");
  const [intMsg,       setIntMsg]       = useState("");
  const [loading,      setLoading]      = useState(false);
  // Real-time comments state (null = not loaded yet, [] = loaded)
  const [comments,     setComments]     = useState(null);

  const ac = {
    sky:    "text-sky-400 border-sky-500/30",
    emerald:"text-emerald-400 border-emerald-500/30",
    violet: "text-violet-400 border-violet-500/30",
  }[accentColor] || "text-sky-400 border-sky-500/30";

  const isOwn      = idea.authorId === currentUserId;
  const hasUpvoted = idea.upvotes?.includes(currentUserId);

  // ── Load comments when card expands ───────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    if (comments !== null) return; // already loaded
    axios.get(`${API}/${idea._id}`, { withCredentials: true })
      .then((res) => setComments(res.data.idea?.comments || []))
      .catch(() => setComments([]));
  }, [expanded, idea._id]);

  // ── Real-time comment socket listener ────────────────────────────────
  const { socketRef, isSocketReady } = useSocket();
  const [commentCount, setCommentCount] = useState(idea.commentCount ?? 0);

  useEffect(() => {
    if (!isSocketReady || !socketRef?.current) return;
    const socket = socketRef.current;

    const onNewComment = (data) => {
      if (data.ideaId !== idea._id.toString()) return;
      setCommentCount(data.commentCount);
      // Append to live list if section is open
      setComments(prev => prev !== null ? [...prev, data.comment] : null);
    };

    const onDeleteComment = (data) => {
      if (data.ideaId !== idea._id.toString()) return;
      setCommentCount(data.commentCount);
      setComments(prev => prev !== null
        ? prev.filter(c => c._id?.toString() !== data.commentId)
        : null
      );
    };

    socket.on("incubation:new_comment",     onNewComment);
    socket.on("incubation:comment_deleted", onDeleteComment);
    return () => {
      socket.off("incubation:new_comment",     onNewComment);
      socket.off("incubation:comment_deleted", onDeleteComment);
    };
  }, [isSocketReady, socketRef, idea._id]);

  const handleUpvote = async () => {
    try {
      await axios.post(`${API}/${idea._id}/upvote`, {}, { withCredentials: true });
      onRefresh();
    } catch { toast.error("Failed to upvote."); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/${idea._id}/comment`, { text: commentText }, { withCredentials: true });
      setCommentText("");
      // Don't call onRefresh — socket event will update comment count + list
      toast.success("Comment added!");
    } catch { toast.error("Failed to add comment."); }
    finally { setLoading(false); }
  };

  const handleInterest = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/${idea._id}/interest`, { type: intType, message: intMsg }, { withCredentials: true });
      setShowInterest(false);
      setIntMsg("");
      onRefresh();
      toast.success("Interest expressed! The author will be notified.");
    } catch { toast.error("Failed."); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this idea?")) return;
    try {
      await axios.delete(`${API}/${idea._id}`, { withCredentials: true });
      onRefresh();
      toast.success("Idea removed.");
    } catch { toast.error("Failed to delete."); }
  };

  return (
    <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
      {/* Card body */}
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STAGE_COLORS[idea.stage] || ""}`}>
                {idea.stage}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[idea.authorRole] || ""}`}>
                {idea.authorRole}
              </span>
            </div>
            <h3 className="text-white font-bold text-base leading-snug">{idea.title}</h3>
          </div>
          {isOwn && (
            <button onClick={handleDelete} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 p-1">
              <PiTrash size={15} />
            </button>
          )}
        </div>

        {/* Author */}
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <PiUser size={11} /> {idea.authorName}
          {idea.authorDept ? ` · ${idea.authorDept}` : ""}
          <span className="ml-1">· {new Date(idea.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </p>

        {/* Description */}
        <p className="text-sm text-slate-300 mt-3 leading-relaxed line-clamp-3">{idea.description}</p>

        {/* Tags */}
        {idea.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {idea.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/[0.05]">
                <PiTag size={9} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Project links for prototype/mvp */}
        {(idea.projectLink || idea.repoLink) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {idea.projectLink && (
              <a href={idea.projectLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                🌐 Live Demo
              </a>
            )}
            {idea.repoLink && (
              <a href={idea.repoLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 border border-white/[0.06] hover:bg-slate-600 transition-all">
                ⚙ GitHub Repo
              </a>
            )}
          </div>
        )}

        {/* Looking for */}
        {idea.lookingFor?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 self-center">Seeking:</span>
            {idea.lookingFor.map((l) => (
              <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="px-5 py-3 border-t border-white/[0.05] flex items-center gap-3 flex-wrap">
        {/* Upvote */}
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            hasUpvoted
              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
              : "bg-slate-800 text-slate-400 border-white/[0.06] hover:text-white hover:bg-slate-700"
          }`}
        >
          <PiArrowUp size={13} className={hasUpvoted ? "text-sky-400" : ""} />
          {idea.upvotes?.length ?? 0} Upvote{(idea.upvotes?.length ?? 0) !== 1 ? "s" : ""}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-white/[0.06] hover:text-white hover:bg-slate-700 transition-all"
        >
          <PiChatCircle size={13} />
          {commentCount} Comment{commentCount !== 1 ? "s" : ""}
        </button>

        {/* Express interest (not own idea) */}
        {!isOwn && (
          <button
            onClick={() => setShowInterest((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            <PiHandshake size={13} />
            I&apos;m Interested ({idea.interestedUsers?.length ?? 0})
          </button>
        )}
      </div>

      {/* Interest form */}
      {showInterest && (
        <div className="px-5 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
          <p className="text-xs text-slate-400 font-semibold">How do you want to contribute?</p>
          <div className="flex flex-wrap gap-2">
            {["investor", "collaborator", "mentor", "other"].map((t) => (
              <button
                key={t}
                onClick={() => setIntType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                  intType === t
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-white/[0.06] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={intMsg}
            onChange={(e) => setIntMsg(e.target.value)}
            placeholder="Add a message to the author (optional)…"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleInterest}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold disabled:opacity-50 transition-all"
            >
              <PiCheck size={13} /> Send
            </button>
            <button onClick={() => setShowInterest(false)} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments section */}
      {expanded && (
        <div className="border-t border-white/[0.05] px-5 py-4 space-y-3">
          {/* Existing comments */}
          {comments === null ? (
            <p className="text-xs text-slate-500">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${ROLE_COLORS[c.authorRole] || "bg-slate-700 text-slate-300"}`}>
                    {c.authorName?.charAt(0)}
                  </div>
                  <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-300">{c.authorName}
                      <span className="font-normal text-slate-500 ml-1">· {c.authorRole}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Add comment */}
          <div className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a suggestion or feedback…"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || loading}
              className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold disabled:opacity-40 transition-all"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Post Idea Modal ───────────────────────────────────────────────────────────
const PostIdeaModal = ({ onClose, onPosted, accentColor }) => {
  const [form, setForm] = useState({
    title: "", description: "", problemStatement: "",
    targetAudience: "", stage: "idea", tags: [], lookingFor: [],
    projectLink: "", repoLink: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 8) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const toggleLookingFor = (opt) => {
    set("lookingFor", form.lookingFor.includes(opt)
      ? form.lookingFor.filter((x) => x !== opt)
      : [...form.lookingFor, opt]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(API, form, { withCredentials: true });
      toast.success("Idea posted! 🚀");
      onPosted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post idea.");
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <PiRocketLaunch className="text-sky-400 text-lg" />
            <h2 className="text-white font-bold text-base">Post Your Idea</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><PiX size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className={lbl}>Idea Title *</label>
            <input type="text" placeholder="e.g. AI-Powered Campus Navigation App" value={form.title}
              onChange={(e) => set("title", e.target.value)} className={inp} maxLength={150} />
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Description *</label>
            <textarea rows={4} placeholder="Describe your idea in detail — what it does, how it works, why it matters…"
              value={form.description} onChange={(e) => set("description", e.target.value)}
              className={`${inp} resize-none`} maxLength={3000} />
            <p className="text-slate-600 text-xs text-right mt-1">{form.description.length}/3000</p>
          </div>

          {/* Problem + Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Problem Statement</label>
              <textarea rows={2} placeholder="What problem does this solve?" value={form.problemStatement}
                onChange={(e) => set("problemStatement", e.target.value)} className={`${inp} resize-none`} maxLength={1000} />
            </div>
            <div>
              <label className={lbl}>Target Audience</label>
              <textarea rows={2} placeholder="Who is this for?" value={form.targetAudience}
                onChange={(e) => set("targetAudience", e.target.value)} className={`${inp} resize-none`} maxLength={500} />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className={lbl}>Current Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.filter((s) => s.key !== "all").map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => set("stage", key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    form.stage === key
                      ? `${STAGE_COLORS[key]} border-current`
                      : "bg-slate-800 text-slate-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={lbl}>Tags (up to 8)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. AI, EdTech, HealthTech" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className={`${inp} flex-1`} />
              <button onClick={addTag} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition-all">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/[0.06]">
                    {t}
                    <button onClick={() => set("tags", form.tags.filter((x) => x !== t))} className="text-slate-500 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Project Links — shown only for Prototype and MVP stages */}
          {(form.stage === "prototype" || form.stage === "mvp") && (
            <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-white/[0.05]">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Share your work — links visible to all viewers
              </p>
              <div>
                <label className={lbl}>Deployed / Live Link</label>
                <input
                  type="url"
                  placeholder="https://yourproject.vercel.app"
                  value={form.projectLink}
                  onChange={(e) => set("projectLink", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>GitHub / Repo Link</label>
                <input
                  type="url"
                  placeholder="https://github.com/yourname/repo"
                  value={form.repoLink}
                  onChange={(e) => set("repoLink", e.target.value)}
                  className={inp}
                />
              </div>
            </div>
          )}

          {/* Looking For */}
          <div>
            <label className={lbl}>Looking For</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <button key={opt} onClick={() => toggleLookingFor(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    form.lookingFor.includes(opt)
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-slate-800 text-slate-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold disabled:opacity-50 transition-all shadow shadow-sky-500/20"
            >
              <PiRocketLaunch size={15} /> {saving ? "Posting…" : "Post Idea"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm hover:bg-slate-700 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Incubation Page ──────────────────────────────────────────────────────
const IncubationPage = ({ accentColor = "sky" }) => {
  const { user } = useContext(Context);
  const [ideas,      setIdeas]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [stage,      setStage]      = useState("all");
  const [myOnly,     setMyOnly]     = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stage !== "all")  params.stage  = stage;
      if (myOnly)           params.mine   = "true";

      const res = await axios.get(API, { params, withCredentials: true });
      // Attach comment count to each idea (from comments array length)
      const ideas = (res.data.ideas || []).map((i) => ({
        ...i,
        commentCount: i.commentCount ?? 0,
      }));
      setIdeas(ideas);
    } catch {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [search, stage, myOnly]);

  useEffect(() => {
    const t = setTimeout(fetchIdeas, 300);
    return () => clearTimeout(t);
  }, [fetchIdeas]);

  const ac = {
    sky:    { ring: "focus:ring-sky-500",    btn: "bg-sky-500 hover:bg-sky-400",    active: "bg-sky-500/15 text-sky-400 border-sky-500/30",    text: "text-sky-400" },
    emerald:{ ring: "focus:ring-emerald-500",btn: "bg-emerald-500 hover:bg-emerald-400", active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", text: "text-emerald-400" },
    violet: { ring: "focus:ring-violet-500", btn: "bg-violet-500 hover:bg-violet-400",  active: "bg-violet-500/15 text-violet-400 border-violet-500/30",  text: "text-violet-400" },
  }[accentColor] || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PiRocketLaunch className={ac.text} /> Incubation Hub
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Share your project ideas, find collaborators, attract mentors and investors
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${ac.btn} text-white text-sm font-bold transition-all shadow flex-shrink-0`}
        >
          <PiPlus size={15} /> Post Idea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas, tags…"
            className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${ac.ring} transition-all`}
          />
        </div>

        {/* Stage filters */}
        <div className="flex gap-1.5 flex-wrap">
          {STAGES.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setStage(key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                stage === key ? ac.active : "bg-slate-800 border-white/[0.06] text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* My ideas toggle */}
        <button
          onClick={() => setMyOnly((v) => !v)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
            myOnly ? ac.active : "bg-slate-800 border-white/[0.06] text-slate-400 hover:text-white"
          }`}
        >
          My Ideas
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-500">
          {ideas.length} idea{ideas.length !== 1 ? "s" : ""}
          {search ? ` matching "${search}"` : ""}
          {myOnly ? " (yours)" : ""}
        </p>
      )}

      {/* Ideas list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-${accentColor === "sky" ? "sky" : accentColor === "emerald" ? "emerald" : "violet"}-500`} />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <PiRocketLaunch className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? `No ideas matching "${search}"` : "No ideas yet. Be the first to post!"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              currentUserId={user?._id}
              accentColor={accentColor}
              onRefresh={fetchIdeas}
            />
          ))}
        </div>
      )}

      {/* Post modal */}
      {showModal && (
        <PostIdeaModal
          accentColor={accentColor}
          onClose={() => setShowModal(false)}
          onPosted={fetchIdeas}
        />
      )}
    </div>
  );
};

export default IncubationPage;
