import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const StudentLayout = () => {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    /* 🔴 BACKEND INTEGRATION (LATER)
       fetch("/api/student/me", {
         headers: {
           Authorization: `Bearer ${token}`
         }
       })
       .then(res => res.json())
       .then(data => setStudent(data));
    */
    setStudent({
      name: "Michael Chen",
      department: "Computer Science",
      year: "Junior",
      stats: {
        alumniCount: 3,
        openPositions: 4,
        discussions: 3,
        events: 3,
      },
    });
  }, []);

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header student={student} />

      <main className="p-4 sm:p-6">
        <Outlet context={{ student }} />
      </main>
    </div>
  );
};

export default StudentLayout;