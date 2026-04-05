// SharedForum.jsx — full Quora-style forum for Student, Alumni, Teacher
// Props: role, accentColor

import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import {
  PiPlus, PiMagnifyingGlass, PiChatsCircle, PiCaretUp,
  PiArrowLeft, PiX, PiCircleNotch, PiTag, PiEye,
  PiChatCircleText, PiTrash, PiCheck,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/forum";

const TAGS = ["all","career","technical","campus","internship","higher-studies","general","placement","skills"];
const TAG_COLORS = {
  career:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  technical:"bg-violet-500/15 text-violet-400 border-violet-500/25",
  campus:"bg-sky-500/15 text-sky-400 border-sky-500/25",
  internship:"bg-amber-500/15 text-amber-400 border-amber-500/25",
  "higher-studies":"bg-pink-500/15 text-pink-400 border-pink-500/25",
  general:"bg-slate-500/15 text-slate-400 border-slate-500/25",
  placement:"bg-orange-500/15 text-orange-400 border-orange-500/25",
  skills:"bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
};
const ROLE_COLORS = {
  Alumni:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Teacher:"bg-violet-500/15 text-violet-400 border-violet-500/25",
  Student:"bg-sky-500/15 text-sky-400 border-sky-500/25",
  Admin:"bg-red-500/15 text-red-400 border-red-500/25",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Ask / Answer Modal ────────────────────────────────────────────────────────
function PostModal({ onClose, onSuccess, accentColor }) {
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [tags, setTags]     = useState([]);
  const [saving, setSaving] = useState(false);
  const accent = { sky:"ring-sky-500 bg-sky-500", emerald:"ring-emerald-500 bg-emerald-500", violet:"ring-violet-500 bg-violet-500" }[accentColor] || "ring-sky-500 bg-sky-500";

  const toggleTag = (t) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const submit = async () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/questions`, { title: title.trim(), body: body.trim(), tags }, { withCredentials: true });
      toast.success("Question posted!");
      onSuccess();
      onClose();
    } catch(e) { toast.error(e.response?.data?.message || "Failed to post."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div><h2 className="text-white font-bold">Ask a Question</h2><p className="text-slate-500 text-xs mt-0.5">Share with the community</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiX size={18}/></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
              placeholder="What do you want to know?"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
            <p className="text-slate-600 text-[10px] mt-1 text-right">{title.length}/200</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Details <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder="Add more context, background, or what you've already tried…"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.filter(t => t !== "all").map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    tags.includes(t) ? TAG_COLORS[t] : "bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500"
                  }`}>
                  {t}
                  {tags.includes(t) && <PiCheck size={10} className="inline ml-1"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={submit} disabled={saving}
            className={`px-5 py-2 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${accent.split(" ")[1]}`}>
            {saving && <PiCircleNotch size={14} className="animate-spin"/>}
            Post Question
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Answer Form ───────────────────────────────────────────────────────────────
function AnswerForm({ questionId, onAnswered, accentColor }) {
  const [body, setBody]     = useState("");
  const [saving, setSaving] = useState(false);
  const btnClass = { sky:"bg-sky-500 hover:bg-sky-400 shadow-sky-500/30", emerald:"bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30", violet:"bg-violet-500 hover:bg-violet-400 shadow-violet-500/30" }[accentColor] || "bg-sky-500 hover:bg-sky-400";

  const submit = async () => {
    if (!body.trim()) { toast.error("Answer cannot be empty."); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/questions/${questionId}/answers`, { body: body.trim() }, { withCredentials: true });
      setBody("");
      toast.success("Answer posted!");
      onAnswered();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
      <p className="text-white text-sm font-semibold">Your Answer</p>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
        placeholder="Write a helpful, detailed answer…"
        className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
      <div className="flex justify-end">
        <button onClick={submit} disabled={saving || !body.trim()}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-bold transition-all shadow disabled:opacity-40 disabled:cursor-not-allowed ${btnClass}`}>
          {saving && <PiCircleNotch size={14} className="animate-spin"/>}
          Post Answer
        </button>
      </div>
    </div>
  );
}

// ── Question Detail View ──────────────────────────────────────────────────────
function QuestionDetail({ questionId, onBack, currentUser, accentColor }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [votingId, setVotingId] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/questions/${questionId}`, { withCredentials: true });
      setData(res.data.question);
    } catch { toast.error("Failed to load question."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [questionId]);

  const upvote = async (answerId) => {
    setVotingId(answerId);
    try {
      const res = await axios.put(`${API}/questions/${questionId}/answers/${answerId}/upvote`, {}, { withCredentials: true });
      setData(prev => ({
        ...prev,
        answers: prev.answers.map(a => a._id === answerId
          ? { ...a, upvotes: Array(res.data.voteCount).fill(null) }
          : a
        ),
      }));
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
    finally { setVotingId(null); }
  };

  const deleteAnswer = async (answerId) => {
    try {
      await axios.delete(`${API}/questions/${questionId}/answers/${answerId}`, { withCredentials: true });
      setData(prev => ({ ...prev, answers: prev.answers.filter(a => a._id !== answerId) }));
      toast.success("Answer deleted.");
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  const deleteQuestion = async () => {
    try {
      await axios.delete(`${API}/questions/${questionId}`, { withCredentials: true });
      toast.success("Question deleted.");
      onBack();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  if (loading) return <div className="min-h-60 flex items-center justify-center"><PiCircleNotch size={28} className="text-sky-400 animate-spin"/></div>;
  if (!data)   return null;

  const isQAuthor = data.author?.id === currentUser?._id?.toString() || data.author?.id?.toString() === currentUser?._id?.toString();

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
        <PiArrowLeft size={16}/> Back to questions
      </button>

      {/* Question */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white font-bold text-lg leading-snug">{data.title}</h2>
          {isQAuthor && (
            <button onClick={deleteQuestion} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
              <PiTrash size={15}/>
            </button>
          )}
        </div>
        {data.body && <p className="text-slate-300 text-sm leading-relaxed">{data.body}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold ${data.author?.role === "Alumni" ? "bg-emerald-600" : data.author?.role === "Teacher" ? "bg-violet-600" : "bg-sky-600"}`}>
              {data.author?.name?.charAt(0)}
            </div>
            <span className="text-slate-400 text-xs">{data.author?.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[data.author?.role]||ROLE_COLORS.Student}`}>{data.author?.role}</span>
          </div>
          <span className="text-slate-600 text-xs">· {timeAgo(data.createdAt)}</span>
          <div className="flex items-center gap-1 text-slate-600 text-xs"><PiEye size={12}/>{data.views} views</div>
        </div>
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map(t => (
              <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TAG_COLORS[t]||TAG_COLORS.general}`}>
                <PiTag size={9}/>{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answers */}
      <div className="space-y-3">
        <p className="text-slate-400 text-sm font-semibold">{data.answers?.length || 0} Answer{data.answers?.length !== 1 ? "s" : ""}</p>

        {(data.answers || []).map((a, i) => {
          const isAnswerAuthor = a.author?.id?.toString() === currentUser?._id?.toString();
          const voteCount = a.upvotes?.length || 0;
          const hasUpvoted = a.upvotes?.map(String).includes(currentUser?._id?.toString());
          const isVoting = votingId === a._id;

          return (
            <div key={a._id} className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${i === 0 ? "border-emerald-500/20" : "border-white/[0.07]"}`}>
              {i === 0 && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <PiCheck size={13}/> Top Answer
                </div>
              )}
              <p className="text-slate-200 text-sm leading-relaxed">{a.body}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold ${a.author?.role === "Alumni" ? "bg-emerald-600" : a.author?.role === "Teacher" ? "bg-violet-600" : "bg-sky-600"}`}>
                    {a.author?.name?.charAt(0)}
                  </div>
                  <span className="text-slate-400 text-xs">{a.author?.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[a.author?.role]||ROLE_COLORS.Student}`}>{a.author?.role}</span>
                  <span className="text-slate-600 text-xs">· {timeAgo(a.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => upvote(a._id)} disabled={isAnswerAuthor || isVoting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      hasUpvoted
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 border-white/[0.07] text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {isVoting ? <PiCircleNotch size={12} className="animate-spin"/> : <PiCaretUp size={12}/>}
                    {voteCount}
                  </button>
                  {isAnswerAuthor && (
                    <button onClick={() => deleteAnswer(a._id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <PiTrash size={13}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!data.isClosed && (
          <AnswerForm questionId={questionId} onAnswered={load} accentColor={accentColor}/>
        )}
      </div>
    </div>
  );
}

// ── Question List Card ────────────────────────────────────────────────────────
function QuestionCard({ q, onClick }) {
  return (
    <button onClick={onClick} className="w-full bg-slate-900 border border-white/[0.07] rounded-xl p-4 text-left hover:border-white/[0.15] transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-sky-300 transition-colors">{q.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold ${q.author?.role === "Alumni" ? "bg-emerald-600" : q.author?.role === "Teacher" ? "bg-violet-600" : "bg-sky-600"}`}>
                {q.author?.name?.charAt(0)}
              </div>
              <span className="text-slate-500 text-xs">{q.author?.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[q.author?.role]||ROLE_COLORS.Student}`}>{q.author?.role}</span>
            </div>
            <span className="text-slate-600 text-xs">{timeAgo(q.createdAt)}</span>
            {q.tags?.slice(0,3).map(t => (
              <span key={t} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${TAG_COLORS[t]||TAG_COLORS.general}`}>
                <PiTag size={8}/>{t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <PiChatCircleText size={13}/>
            <span className={q.answerCount > 0 ? "text-emerald-400 font-semibold" : ""}>{q.answerCount}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <PiEye size={11}/>
            {q.views}
          </div>
          {q.topVotes > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-[10px] font-semibold">
              <PiCaretUp size={11}/>{q.topVotes}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SharedForum({ role, accentColor = "sky" }) {
  const { user }               = useContext(Context);
  const [questions, setQs]     = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState("");
  const [activeTag, setTag]    = useState("all");
  const [sort, setSort]        = useState("newest");
  const [page, setPage]        = useState(1);
  const [total, setTotal]      = useState(0);
  const [showModal, setModal]  = useState(false);
  const [openQId, setOpenQ]    = useState(null);

  const LIMIT = 15;
  const btnClass = {
    sky: "bg-sky-500 hover:bg-sky-400 shadow-sky-500/30",
    emerald: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30",
    violet: "bg-violet-500 hover:bg-violet-400 shadow-violet-500/30",
  }[accentColor] || "bg-sky-500 hover:bg-sky-400";

  const fetchQuestions = async (p = page) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/questions`, {
        params: { search: search || undefined, tag: activeTag, sort, page: p, limit: LIMIT },
        withCredentials: true,
      });
      setQs(res.data.questions || []);
      setTotal(res.data.total || 0);
    } catch { toast.error("Failed to load questions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchQuestions(1); }, [search, activeTag, sort]);

  // If a question is open, show detail
  if (openQId) {
    return (
      <div className="max-w-4xl mx-auto">
        <QuestionDetail
          questionId={openQId}
          currentUser={user}
          accentColor={accentColor}
          onBack={() => { setOpenQ(null); fetchQuestions(); }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Discussion Forum</h2>
          <p className="text-slate-400 text-sm mt-0.5">{total} question{total !== 1 ? "s" : ""} · Ask anything, answer others</p>
        </div>
        <button onClick={() => setModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow self-start sm:self-auto ${btnClass}`}>
          <PiPlus size={15}/> Ask Question
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div className="flex gap-1 bg-slate-800 border border-white/[0.07] rounded-lg p-1">
            {["newest","top","unanswered"].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sort===s?"bg-slate-700 text-white":"text-slate-500 hover:text-slate-300"}`}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                activeTag === t
                  ? (t === "all" ? "bg-slate-600 text-white border-slate-500" : TAG_COLORS[t])
                  : "bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300"
              }`}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      {loading ? (
        <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-slate-500 animate-spin"/></div>
      ) : questions.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiChatsCircle size={28} className="text-slate-600"/>
          </div>
          <p className="text-slate-300 font-semibold">No questions found</p>
          <p className="text-slate-500 text-sm mt-1">Be the first to start a discussion!</p>
          <button onClick={() => setModal(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">
            <PiPlus size={14}/> Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => <QuestionCard key={q._id} q={q} onClick={() => setOpenQ(q._id)}/>)}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => { const p=page-1; setPage(p); fetchQuestions(p); }}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-all">
            Previous
          </button>
          <span className="px-4 py-2 text-slate-400 text-sm">Page {page} of {Math.ceil(total/LIMIT)}</span>
          <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => { const p=page+1; setPage(p); fetchQuestions(p); }}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-all">
            Next
          </button>
        </div>
      )}

      {showModal && <PostModal onClose={() => setModal(false)} onSuccess={() => fetchQuestions(1)} accentColor={accentColor}/>}
    </div>
  );
}
