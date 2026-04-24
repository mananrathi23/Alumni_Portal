import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import { PiUserCircle, PiCheckCircle, PiWarningCircle, PiShieldSlash, PiShieldCheck } from "react-icons/pi";

const Users = () => {
  const { theme } = useContext(Context);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("All");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/admin/users`, {
        withCredentials: true,
      });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleVerify = async (userId, role) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}`}/api/v1/admin/users/${role}/${userId}/verify`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, adminVerified: res.data.user.adminVerified } : u))
      );
    } catch (err) {
      toast.error("Failed to update verification status.");
    }
  };

  const toggleBlock = async (userId, role) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}`}/api/v1/admin/users/${role}/${userId}/block`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u))
      );
    } catch (err) {
      toast.error("Failed to block/unblock user.");
    }
  };

  const filteredUsers = filterRole === "All" ? users : users.filter((u) => u.role === filterRole);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          User Management
        </h2>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            theme === "dark"
              ? "bg-slate-800 border-white/10 text-white"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          <option value="All">All Roles</option>
          <option value="Student">Students</option>
          <option value="Alumni">Alumni</option>
          <option value="Teacher">Teachers</option>
        </select>
      </div>

      <div className={`rounded-xl border overflow-hidden ${theme === "dark" ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wider ${theme === "dark" ? "border-white/10 bg-slate-800/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-slate-100"}`}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className={`transition-colors ${theme === "dark" ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profilePhoto?.url ? (
                          <img src={user.profilePhoto.url} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${user.role === 'Student' ? 'from-sky-400 to-sky-600' : user.role === 'Alumni' ? 'from-emerald-400 to-emerald-600' : 'from-violet-400 to-violet-600'}`}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {user.name}
                          </p>
                          <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            {user.email}
                          </p>
                          {(user.role === "Student" || user.role === "Alumni") && user.enrollmentYear && (
                            <p className={`text-[10px] mt-0.5 font-medium ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                              Class of {user.enrollmentYear}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        user.role === "Student" ? "bg-sky-500/10 text-sky-500" :
                        user.role === "Alumni"  ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-violet-500/10 text-violet-500"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {user.adminVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                            <PiCheckCircle size={14} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
                            <PiWarningCircle size={14} /> Pending
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <PiShieldSlash size={14} /> Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleVerify(user._id, user.role)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition ${
                          user.adminVerified
                            ? "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {user.adminVerified ? "Unverify" : "Verify"}
                      </button>
                      <button
                        onClick={() => toggleBlock(user._id, user.role)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition ${
                          user.isBlocked
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
