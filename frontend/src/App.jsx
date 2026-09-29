import './App.css'
import MainPage from './Components/MainPage.jsx'
import { lazy, Suspense, useContext, useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Auth from './Components/Authentication/Auth.jsx'
import OtpVerification from './Components/Authentication/OtpVerification.jsx'
import ResetPassword from './Components/Authentication/ResetPassword.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import { ToastContainer } from 'react-toastify'
import { Context } from './context'
const ChatbotWidget = lazy(() => import('./Components/ChatbotWidget.jsx'))

// Sidebar frame for Students, Alumni and Teachers (Admin has its own)
const MemberLayout = lazy(() => import('./Components/MemberLayout.jsx'))

// ─── STUDENT ──────────────────────────────────────────────────────────────────
const StudentDashboardHome = lazy(() => import('./Components/StudentDashboard/DashboardHome.jsx'))
const StudentForum = lazy(() => import('./Components/StudentDashboard/Forum.jsx'))
const StudentAlumni = lazy(() => import('./Components/StudentDashboard/Alumni.jsx'))
const StudentJobs = lazy(() => import('./Components/StudentDashboard/Jobs.jsx'))
const StudentEvents = lazy(() => import('./Components/StudentDashboard/Events.jsx'))
const StudentMessages = lazy(() => import('./Components/StudentDashboard/Messages.jsx'))
const StudentRequests = lazy(() => import('./Components/StudentDashboard/Requests.jsx'))
const StudentProfile = lazy(() => import('./Components/StudentDashboard/Profile.jsx'))
const StudentMentorship = lazy(() => import('./Components/StudentDashboard/Mentorship.jsx'))
const StudentBatchmates = lazy(() => import('./Components/StudentDashboard/Batchmates.jsx'))
const StudentIncubation = lazy(() => import('./Components/StudentDashboard/Incubation.jsx'))

// ─── TEACHER ──────────────────────────────────────────────────────────────────
const TeacherDashboardHome = lazy(() => import('./Components/TeacherDashboard/DashboardHome.jsx'))
const TeacherForum = lazy(() => import('./Components/TeacherDashboard/Forum.jsx'))
const TeacherStudents = lazy(() => import('./Components/TeacherDashboard/Students.jsx'))
const TeacherJobs = lazy(() => import('./Components/TeacherDashboard/Jobs.jsx'))
const TeacherEvents = lazy(() => import('./Components/TeacherDashboard/Events.jsx'))
const TeacherMessages = lazy(() => import('./Components/TeacherDashboard/Messages.jsx'))
const TeacherMentorship = lazy(() => import('./Components/TeacherDashboard/Mentorship.jsx'))
const TeacherProfile = lazy(() => import('./Components/TeacherDashboard/Profile.jsx'))
const TeacherBatchmates = lazy(() => import('./Components/TeacherDashboard/Batchmates.jsx'))
const TeacherIncubation = lazy(() => import('./Components/TeacherDashboard/Incubation.jsx'))

// ─── ALUMNI ───────────────────────────────────────────────────────────────────
const AlumniDashboardHome = lazy(() => import('./Components/AlumniDashboard/DashboardHome.jsx'))
const AlumniForum = lazy(() => import('./Components/AlumniDashboard/Forum.jsx'))
const AlumniStudents = lazy(() => import('./Components/AlumniDashboard/Students.jsx'))
const AlumniJobs = lazy(() => import('./Components/AlumniDashboard/Jobs.jsx'))
const AlumniEvents = lazy(() => import('./Components/AlumniDashboard/Events.jsx'))
const AlumniMessages = lazy(() => import('./Components/AlumniDashboard/Messages.jsx'))
const AlumniMentorship = lazy(() => import('./Components/AlumniDashboard/Mentorship.jsx'))
const AlumniProfile = lazy(() => import('./Components/AlumniDashboard/Profile.jsx'))
const AlumniBatchmates = lazy(() => import('./Components/AlumniDashboard/Batchmates.jsx'))
const AlumniIncubation = lazy(() => import('./Components/AlumniDashboard/Incubation.jsx'))

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminLayout = lazy(() => import('./Components/AdminDashboard/AdminLayout.jsx'))
const AdminDashboardHome = lazy(() => import('./Components/AdminDashboard/DashboardHome.jsx'))
const AdminNews = lazy(() => import('./Components/AdminDashboard/News.jsx'))
const AdminEvents = lazy(() => import('./Components/AdminDashboard/Events.jsx'))
const AdminJobs = lazy(() => import('./Components/AdminDashboard/Jobs.jsx'))
const AdminUsers = lazy(() => import('./Components/AdminDashboard/Users.jsx'))
const AdminSupportTickets = lazy(() => import('./Components/AdminDashboard/SupportTickets.jsx'))
const AdminStudentProfiles = lazy(() => import('./Components/AdminDashboard/StudentProfiles.jsx'))

const GoogleLinked = lazy(() => import('./Components/GoogleLinked.jsx'))
const OAuthSuccess = lazy(() => import('./Components/OAuthSuccess.jsx'))

// Each role's pages are split into their own chunks and downloaded on first
// visit, so a student never downloads the admin, teacher or alumni screens.
const PageFallback = () => (
  <div className="flex justify-center items-center min-h-[40vh]">
    <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
  </div>
)
const page = (element) => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
)

function App() {
  const { theme } = useContext(Context);
  const router = useMemo(() => createBrowserRouter([
    { path: '/', element: <MainPage /> },
    { path: '/login', element: <Auth /> },
    { path: '/otp-verification/:email/:role', element: <OtpVerification /> },
    { path: '/password/reset/:token', element: <ResetPassword /> },
    { path: '/google-linked',  element: page(<GoogleLinked />) },
    { path: '/oauth-success',  element: page(<OAuthSuccess />) },

    // ─── STUDENT ──────────────────────────────────────────────────────────────
    {
      path: '/student',
      element: <ProtectedRoute allowedRole="Student">{page(<MemberLayout role="Student" />)}</ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: page(<StudentDashboardHome />) },
        { path: 'forum',      element: page(<StudentForum />) },
        { path: 'alumni',     element: page(<StudentAlumni />) },
        { path: 'jobs',       element: page(<StudentJobs />) },
        { path: 'events',     element: page(<StudentEvents />) },
        { path: 'messages',   element: page(<StudentMessages />) },
        { path: 'requests',   element: page(<StudentRequests />) },
        { path: 'profile',    element: page(<StudentProfile />) },
        { path: 'mentorship', element: page(<StudentMentorship />) },
        { path: 'batchmates', element: page(<StudentBatchmates />) },
        { path: 'incubation', element: page(<StudentIncubation />) },
      ],
    },

    // ─── TEACHER ──────────────────────────────────────────────────────────────
    {
      path: '/teacher',
      element: <ProtectedRoute allowedRole="Teacher">{page(<MemberLayout role="Teacher" />)}</ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: page(<TeacherDashboardHome />) },
        { path: 'forum',      element: page(<TeacherForum />) },
        { path: 'students',   element: page(<TeacherStudents />) },
        { path: 'jobs',       element: page(<TeacherJobs />) },
        { path: 'events',     element: page(<TeacherEvents />) },
        { path: 'messages',   element: page(<TeacherMessages />) },
        { path: 'mentorship', element: page(<TeacherMentorship />) },
        { path: 'profile',    element: page(<TeacherProfile />) },
        { path: 'batchmates', element: page(<TeacherBatchmates />) },
        { path: 'incubation', element: page(<TeacherIncubation />) },
      ],
    },

    // ─── ALUMNI ───────────────────────────────────────────────────────────────
    {
      path: '/alumni',
      element: <ProtectedRoute allowedRole="Alumni">{page(<MemberLayout role="Alumni" />)}</ProtectedRoute>,
      children: [
        { path: 'dashboard',  element: page(<AlumniDashboardHome />) },
        { path: 'forum',      element: page(<AlumniForum />) },
        { path: 'students',   element: page(<AlumniStudents />) },
        { path: 'jobs',       element: page(<AlumniJobs />) },
        { path: 'events',     element: page(<AlumniEvents />) },
        { path: 'messages',   element: page(<AlumniMessages />) },
        { path: 'mentorship', element: page(<AlumniMentorship />) },
        { path: 'profile',    element: page(<AlumniProfile />) },
        { path: 'batchmates', element: page(<AlumniBatchmates />) },
        { path: 'incubation', element: page(<AlumniIncubation />) },
      ],
    },

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    {
      path: '/admin',
      element: <ProtectedRoute allowedRole="Admin">{page(<AdminLayout />)}</ProtectedRoute>,
      children: [
        { path: 'dashboard', element: page(<AdminDashboardHome />) },
        { path: 'news',      element: page(<AdminNews />) },
        { path: 'events',    element: page(<AdminEvents />) },
        { path: 'jobs',      element: page(<AdminJobs />) },
        { path: 'students',  element: page(<AdminStudentProfiles />) },
        { path: 'users',     element: page(<AdminUsers />) },
        { path: 'support',   element: page(<AdminSupportTickets />) },
      ],
    },
  ]), []);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" theme={theme === "dark" ? "dark" : "light"} />
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
    </>
  )
}

export default App
