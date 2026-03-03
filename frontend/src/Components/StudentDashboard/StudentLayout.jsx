import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const StudentLayout = () => {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/me",
          { withCredentials: true },
        );

        setStudent(data.user);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStudent();
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