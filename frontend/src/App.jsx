import './App.css'
import MainPage from './Components/MainPage.jsx'
import { useContext } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Auth from './Components/Authentication/Auth.jsx'
import OtpVerification from './Components/Authentication/OtpVerification.jsx'
import ResetPassword from './Components/Authentication/ResetPassword.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import { ToastContainer } from 'react-toastify'
import { Context } from './main'
import ChatbotWidget from './Components/ChatbotWidget.jsx'

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
import StudentMentorship from './Components/StudentDashboard/Mentorship.jsx'
import StudentBatchmates from './Components/StudentDashboard/Batchmates.jsx'
import StudentIncubation from './Components/StudentDashboard/Incubation.jsx'

// ─── TEACHER ──────────────────────────────────────────────────────────────────
import TeacherLayout from './Components/TeacherDashboard/TeacherLayout.jsx'
import TeacherDashboardHome from './Components/TeacherDashboard/DashboardHome.jsx'
import TeacherForum from './Components/TeacherDashboard/Forum.jsx'
import TeacherStudents from './Components/TeacherDashboard/Students.jsx'
import TeacherJobs from './Components/TeacherDashboard/Jobs.jsx'
import TeacherEvents from './Components/TeacherDashboard/Events.jsx'
import TeacherMessages from './Components/TeacherDashboard/Messages.jsx'
import TeacherMentorship from './Components/TeacherDashboard/Mentorship.jsx'
import TeacherProfile from './Components/TeacherDashboard/Profile.jsx'
import TeacherBatchmates from './Components/TeacherDashboard/Batchmates.jsx'
import TeacherIncubation from './Components/TeacherDashboard/Incubation.jsx'

// ─── ALUMNI ───────────────────────────────────────────────────────────────────
import AlumniLayout from './Components/AlumniDashboard/AlumniLayout.jsx'
import AlumniDashboardHome from './Components/AlumniDashboard/DashboardHome.jsx'
import AlumniForum from './Components/AlumniDashboard/Forum.jsx'
import AlumniStudents from './Components/AlumniDashboard/Students.jsx'
import AlumniJobs from './Components/AlumniDashboard/Jobs.jsx'
import AlumniEvents from './Components/AlumniDashboard/Events.jsx'
import AlumniMessages from './Components/AlumniDashboard/Messages.jsx'
import AlumniMentorship from './Components/AlumniDashboard/Mentorship.jsx'
import AlumniProfile from './Components/AlumniDashboard/Profile.jsx'
import AlumniBatchmates from './Components/AlumniDashboard/Batchmates.jsx'
import AlumniIncubation from './Components/AlumniDashboard/Incubation.jsx'

// ─── ADMIN ────────────────────────────────────────────────────────────────────
import AdminLayout from './Components/AdminDashboard/AdminLayout.jsx'
import AdminDashboardHome from './Components/AdminDashboard/DashboardHome.jsx'
import AdminNews from './Components/AdminDashboard/News.jsx'
import AdminEvents from './Components/AdminDashboard/Events.jsx'
import AdminJobs from './Components/AdminDashboard/Jobs.jsx'
import AdminUsers from './Components/AdminDashboard/Users.jsx'
import AdminSupportTickets from './Components/AdminDashboard/SupportTickets.jsx'
import AdminStudentProfiles from './Components/AdminDashboard/StudentProfiles.jsx'

import GoogleLinked from './Components/GoogleLinked.jsx'
import OAuthSuccess from './Components/OAuthSuccess.jsx'

function App() {
  const { theme } = useContext(Context);
  const router = createBrowserRouter([
    { path: '/', element: <MainPage /> },
    { path: '/login', element: <Auth /> },
    { path: '/otp-verification/:email/:role', element: <OtpVerification /> },
    { path: '/password/reset/:token', element: <ResetPassword /> },
    { path: '/google-linked',  element: <GoogleLinked /> },
    { path: '/oauth-success',  element: <OAuthSuccess /> },

    // ─── STUDENT ──────────────────────────────────────────────────────────────
    {
      path: '/student',
      element: <ProtectedRoute allowedRole="Student"><StudentLayout /></ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: <StudentDashboardHome /> },
        { path: 'forum',      element: <StudentForum /> },
        { path: 'alumni',     element: <StudentAlumni /> },
        { path: 'jobs',       element: <StudentJobs /> },
        { path: 'events',     element: <StudentEvents /> },
        { path: 'messages',   element: <StudentMessages /> },
        { path: 'requests',   element: <StudentRequests /> },
        { path: 'profile',    element: <StudentProfile /> },
        { path: 'mentorship', element: <StudentMentorship /> },
        { path: 'batchmates', element: <StudentBatchmates /> },
        { path: 'incubation', element: <StudentIncubation /> },
      ],
    },

    // ─── TEACHER ──────────────────────────────────────────────────────────────
    {
      path: '/teacher',
      element: <ProtectedRoute allowedRole="Teacher"><TeacherLayout /></ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: <TeacherDashboardHome /> },
        { path: 'forum',      element: <TeacherForum /> },
        { path: 'students',   element: <TeacherStudents /> },
        { path: 'jobs',       element: <TeacherJobs /> },
        { path: 'events',     element: <TeacherEvents /> },
        { path: 'messages',   element: <TeacherMessages /> },
        { path: 'mentorship', element: <TeacherMentorship /> },
        { path: 'profile',    element: <TeacherProfile /> },
        { path: 'batchmates', element: <TeacherBatchmates /> },
        { path: 'incubation', element: <TeacherIncubation /> },
      ],
    },

    // ─── ALUMNI ───────────────────────────────────────────────────────────────
    {
      path: '/alumni',
      element: <ProtectedRoute allowedRole="Alumni"><AlumniLayout /></ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: <AlumniDashboardHome /> },
        { path: 'forum',      element: <AlumniForum /> },
        { path: 'students',   element: <AlumniStudents /> },
        { path: 'jobs',       element: <AlumniJobs /> },
        { path: 'events',     element: <AlumniEvents /> },
        { path: 'messages',   element: <AlumniMessages /> },
        { path: 'mentorship', element: <AlumniMentorship /> },
        { path: 'profile',    element: <AlumniProfile /> },
        { path: 'batchmates', element: <AlumniBatchmates /> },
        { path: 'incubation', element: <AlumniIncubation /> },
      ],
    },

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    {
      path: '/admin',
      element: <ProtectedRoute allowedRole="Admin"><AdminLayout /></ProtectedRoute>,
      children: [
        { path: 'dashboard', element: <AdminDashboardHome /> },
        { path: 'news',      element: <AdminNews /> },
        { path: 'events',    element: <AdminEvents /> },
        { path: 'jobs',      element: <AdminJobs /> },
        { path: 'students',  element: <AdminStudentProfiles /> },
        { path: 'users',     element: <AdminUsers /> },
        { path: 'support',   element: <AdminSupportTickets /> },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" theme={theme === "dark" ? "dark" : "light"} />
      <ChatbotWidget />
    </>
  )
}

export default App
