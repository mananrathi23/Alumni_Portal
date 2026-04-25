import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import { PiCheckCircle, PiPaperPlaneRight, PiRobot, PiUser, PiWarningCircle } from "react-icons/pi";

const SupportTickets = () => {
  const { theme } = useContext(Context);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/support/admin/tickets", {
        withCredentials: true,
      });
      setTickets(res.data.tickets || []);
    } catch (err) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const handleReply = async (e, resolve = false) => {
    if (e) e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !resolve)) return;

    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/support/admin/tickets/${selectedTicket._id}/reply`,
        { text: replyText.trim(), resolve },
        { withCredentials: true }
      );
      
      const updatedTicket = res.data.ticket;
      
      // Re-populate userId since the backend returns the populated object if it was already populated? 
      // Actually backend just returns the saved ticket which has userId as ObjectId. We need to keep the populated user.
      const populatedTicket = {
        ...updatedTicket,
        userId: selectedTicket.userId
      };

      setTickets((prev) => prev.map((t) => (t._id === populatedTicket._id ? populatedTicket : t)));
      
      if (resolve) {
        setSelectedTicket(null);
        toast.success("Ticket resolved!");
        // Remove resolved ticket from list
        setTickets((prev) => prev.filter((t) => t._id !== populatedTicket._id));
      } else {
        setSelectedTicket(populatedTicket);
        setReplyText("");
      }

    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Support Escalations
        </h2>
        <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
          Users who need human assistance or encountered an issue the AI couldn't resolve.
        </p>
      </div>

      <div className={`flex h-[600px] border rounded-2xl overflow-hidden shadow-sm ${theme === "dark" ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
        
        {/* Left Pane - Ticket List */}
        <div className={`w-1/3 border-r flex flex-col ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          <div className={`p-4 border-b font-semibold ${theme === "dark" ? "border-white/10 text-white bg-slate-800/50" : "border-slate-200 text-slate-800 bg-slate-50"}`}>
            Open Tickets ({tickets.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 h-full">
                <PiCheckCircle size={48} className="mb-2 text-emerald-500/50" />
                <p>No open support tickets.</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedTicket?._id === ticket._id
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : theme === "dark"
                      ? "hover:bg-slate-800 text-slate-300"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm truncate pr-2">
                      {ticket.userId?.name || "Unknown User"}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      selectedTicket?._id === ticket._id ? "bg-white/20" : "bg-red-500/10 text-red-500"
                    }`}>
                      {ticket.userModel}
                    </span>
                  </div>
                  <div className={`text-xs truncate ${selectedTicket?._id === ticket._id ? "text-sky-100" : "text-slate-500"}`}>
                    {ticket.messages[ticket.messages.length - 1]?.text || "No messages"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat View */}
        <div className="w-2/3 flex flex-col">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b flex items-center justify-between ${theme === "dark" ? "border-white/10 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  {selectedTicket.userId?.profilePhoto?.url ? (
                    <img src={selectedTicket.userId.profilePhoto.url} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                      {selectedTicket.userId?.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {selectedTicket.userId?.name}
                    </h3>
                    <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {selectedTicket.userId?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReply(null, true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  Mark as Resolved
                </button>
              </div>

              {/* Chat Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme === "dark" ? "bg-slate-900/50" : "bg-slate-50/50"}`}>
                {selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[75%] ${msg.sender === "Admin" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold text-slate-400">
                      {msg.sender === "AI" && <PiRobot />}
                      {msg.sender === "Admin" && <PiCheckCircle className="text-emerald-500" />}
                      {msg.sender === "User" && <PiUser />}
                      {msg.sender}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm
                        ${msg.sender === "Admin" 
                          ? "bg-sky-500 text-white rounded-br-sm" 
                          : msg.sender === "System" 
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 italic"
                          : msg.sender === "AI"
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-300 dark:border-white/5"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-white/5"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className={`p-4 border-t ${theme === "dark" ? "border-white/10 bg-slate-800/30" : "border-slate-200 bg-white"}`}>
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply to the user..."
                    className={`flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm ${
                      theme === "dark" ? "bg-slate-900 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20"
                  >
                    <PiPaperPlaneRight size={18} className={replyText.trim() ? "translate-x-0.5" : ""} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full text-slate-500 ${theme === "dark" ? "bg-slate-900/50" : "bg-slate-50/50"}`}>
              <PiWarningCircle size={48} className="mb-2 opacity-20" />
              <p>Select a ticket from the left to view the chat</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupportTickets;
