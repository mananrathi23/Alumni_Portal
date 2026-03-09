import Header from "./Header";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../../main";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isAlumniProfileComplete } from "./Profile";

const AlumniLayout = () => {
  const [alumni, setAlumni] = useState(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get("http://localhost:4000/api/v1/user/me", { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setAlumni(res.data.user);
        if (!isAlumniProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
  }, []);

  if (!alumni) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header alumni={alumni} />
      <div className="flex flex-1 pt-14">
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ alumni }} />
        </main>
      </div>
      {showIncompleteModal && (
        <ProfileIncompleteModal alumni={alumni} onClose={() => setShowIncompleteModal(false)} />
      )}
    </div>
  );
};
export default AlumniLayout;
