import './App.css'
import MainPage from './Components/MainPage.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Auth from './Components/Authentication/Auth.jsx'
import OtpVerification from './Components/Authentication/OtpVerification.jsx'
import ResetPassword from './Components/Authentication/ResetPassword.jsx'
import { ToastContainer } from 'react-toastify'

// ─── STUDENT ──────────────────────────────────────────────────────────────────
import StudentLayout from './Components/StudentDashboard/StudentLayout.jsx'
import StudentDashboardHome from './Components/StudentDashboard/DashboardHome.jsx'
import StudentForum from './Components/StudentDashboard/Forum.jsx'
import StudentAlumni from './Components/StudentDashboard/Alumni.jsx'
import StudentJobs from './Components/StudentDashboard/Jobs.jsx'
import StudentEvents from './Components/StudentDashboard/Events.jsx'
import StudentMessages from './Components/StudentDashboard/Messages.jsx'
import StudentRequests from './Components/StudentDashboard/Requests.jsx'
import StudentProfile from './Components/StudentDashboard/Profile.jsx'

// ─── TEACHER ──────────────────────────────────────────────────────────────────
import TeacherLayout from './Components/TeacherDashboard/TeacherLayout.jsx'
import TeacherDashboardHome from './Components/TeacherDashboard/DashboardHome.jsx'
import TeacherForum from './Components/TeacherDashboard/Forum.jsx'
import TeacherStudents from './Components/TeacherDashboard/Students.jsx'
import TeacherJobs from './Components/TeacherDashboard/Jobs.jsx'
import TeacherEvents from './Components/TeacherDashboard/Events.jsx'
import TeacherMessages from './Components/TeacherDashboard/Messages.jsx'
import TeacherMentorship from './Components/TeacherDashboard/Mentorship.jsx'
import AlumniProfile from './Components/AlumniDashboard/Profile.jsx'
import TeacherProfile from './Components/TeacherDashboard/Profile.jsx'

// ─── ALUMNI ───────────────────────────────────────────────────────────────────
import AlumniLayout from './Components/AlumniDashboard/AlumniLayout.jsx'
import AlumniDashboardHome from './Components/AlumniDashboard/DashboardHome.jsx'
import AlumniForum from './Components/AlumniDashboard/Forum.jsx'
import AlumniStudents from './Components/AlumniDashboard/Students.jsx'
import AlumniJobs from './Components/AlumniDashboard/Jobs.jsx'
import AlumniEvents from './Components/AlumniDashboard/Events.jsx'
import AlumniMessages from './Components/AlumniDashboard/Messages.jsx'
import AlumniMentorship from './Components/AlumniDashboard/Mentorship.jsx'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainPage />,
    },
    {
      path: '/login',
      element: <Auth />,
    },
    {
      path: '/otp-verification/:email/:phone/:role',
      element: <OtpVerification />,
    },
    {
      path: '/password/reset/:token',
      element: <ResetPassword />,
    },

    // ─── STUDENT ──────────────────────────────────────────────────────────────
    {
      path: '/student',
      element: <StudentLayout />,
      children: [
        { path: 'dashboard', element: <StudentDashboardHome /> },
        { path: 'forum',     element: <StudentForum /> },
        { path: 'alumni',    element: <StudentAlumni /> },
        { path: 'jobs',      element: <StudentJobs /> },
        { path: 'events',    element: <StudentEvents /> },
        { path: 'messages',  element: <StudentMessages /> },
        { path: 'requests',  element: <StudentRequests /> },
        { path: 'profile',   element: <StudentProfile /> },
      ],
    },

    // ─── TEACHER ──────────────────────────────────────────────────────────────
    {
      path: '/teacher',
      element: <TeacherLayout />,
      children: [
        { path: 'dashboard',  element: <TeacherDashboardHome /> },
        { path: 'forum',      element: <TeacherForum /> },
        { path: 'students',   element: <TeacherStudents /> },
        { path: 'jobs',       element: <TeacherJobs /> },
        { path: 'events',     element: <TeacherEvents /> },
        { path: 'messages',   element: <TeacherMessages /> },
        { path: 'mentorship', element: <TeacherMentorship /> },
        { path: 'profile', element: <TeacherProfile /> },
      ],
    },

    // ─── ALUMNI ───────────────────────────────────────────────────────────────
    {
      path: '/alumni',
      element: <AlumniLayout />,
      children: [
        { path: 'dashboard',  element: <AlumniDashboardHome /> },
        { path: 'forum',      element: <AlumniForum /> },
        { path: 'students',   element: <AlumniStudents /> },
        { path: 'jobs',       element: <AlumniJobs /> },
        { path: 'events',     element: <AlumniEvents /> },
        { path: 'messages',   element: <AlumniMessages /> },
        { path: 'mentorship', element: <AlumniMentorship /> },
        { path: 'profile', element: <AlumniProfile /> },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}

export default App