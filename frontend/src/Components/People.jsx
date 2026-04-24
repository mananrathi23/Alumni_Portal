import { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaUserAlt, FaUserGraduate, FaChalkboardTeacher, FaBriefcase } from "react-icons/fa";
import ConnectButton from "../ConnectButton";

// ─────────────────────────────────────────────────────────────────────────────
// People.jsx (AlumniDashboard + TeacherDashboard)
// Shows ALL people — Students + Alumni + Teachers
// Use this for the "Students" page in Alumni/Teacher dashboard
// ─────────────────────────────────────────────────────────────────────────────

const People = () => {
  const [people,     setPeople]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [department, setDepartment] = useState("All");

  // ── Fetch people ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    const params = {};
    if (search)               params.search     = search;
    if (filterRole !== "All") params.filterRole = filterRole;
    if (department !== "All") params.department = department;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/people`, {
        params,
        withCredentials: true,
      })
      .then((res) => setPeople(res.data.people))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, filterRole, department]);

  // ── Role badge ────────────────────────────────────────────────────────────
  const roleBadge = (role) => {
    if (role === "Student") return { style: "bg-green-100 text-green-700",  icon: <FaUserAlt className="text-xs" /> };
    if (role === "Alumni")  return { style: "bg-purple-100 text-purple-700", icon: <FaUserGraduate className="text-xs" /> };
    if (role === "Teacher") return { style: "bg-blue-100 text-blue-700",    icon: <FaChalkboardTeacher className="text-xs" /> };
    return { style: "bg-gray-100 text-gray-600", icon: null };
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">People Directory</h2>
        <p className="text-sm text-gray-500">
          {people.length} people found — students, alumni and teachers
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row gap-3">

        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Roles</option>
          <option value="Student">Students Only</option>
          <option value="Alumni">Alumni Only</option>
          <option value="Teacher">Teachers Only</option>
        </select>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="IT">IT</option>
        </select>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-400">
          Loading...
        </div>
      ) : people.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-center text-gray-500">
          <FaUserAlt className="text-5xl text-gray-300 mb-4" />
          <p className="font-medium">No people found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const badge = roleBadge(person.role);
            return (
              <div key={person._id} className="border rounded-xl p-4 hover:shadow-md transition space-y-3">

                {/* TOP */}
                <div className="flex items-start gap-3">
                  <img
                    src={person.profilePhoto?.url || "https://i.pravatar.cc/48"}
                    alt={person.name}
                    className="w-12 h-12 rounded-full border object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{person.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.style}`}>
                      {badge.icon} {person.role}
                    </span>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="space-y-1 text-sm text-gray-500">
                  {person.department  && <p className="truncate">📚 {person.department}</p>}
                  {person.year        && <p>🎓 {person.year}</p>}
                  {person.designation && <p className="truncate flex items-center gap-1"><FaBriefcase className="text-xs" /> {person.designation}</p>}
                  {person.currentDesignation && <p className="truncate">💼 {person.currentDesignation}</p>}
                  {person.currentCompany     && <p className="truncate">🏢 {person.currentCompany}</p>}
                  {person.graduationYear     && <p>🎓 Class of {person.graduationYear}</p>}
                </div>

                {/* SKILLS */}
                {person.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {person.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {person.skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{person.skills.length - 3}</span>
                    )}
                  </div>
                )}

                {/* CONNECT BUTTON */}
                <div className="pt-1">
                  <ConnectButton
                    targetId={person._id}
                    targetRole={person.role}
                    targetName={person.name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default People;