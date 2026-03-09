import Header from "./Header";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../../main";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isProfileComplete } from "./Profile";

const StudentLayout = () => {
  const [student, setStudent] = useState(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/v1/user/me", { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setStudent(res.data.user);
        // Show popup only if profile is incomplete
        if (!isProfileComplete(res.data.user)) {
          setShowIncompleteModal(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        navigate("/login");
      });
  }, []);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header student={student} />

      <div className="flex flex-1 pt-14">
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ student }} />
        </main>
      </div>

      {showIncompleteModal && (
        <ProfileIncompleteModal
          student={student}
          onClose={() => setShowIncompleteModal(false)}
        />
      )}
    </div>
  );
};

export default StudentLayout;
