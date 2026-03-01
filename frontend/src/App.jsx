import { useState } from 'react'
import MainPage from './Components/MainPage.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Auth from './Components/Authentication/Auth.jsx'
import OtpVerification from './Components/Authentication/OtpVerification.jsx'
import ResetPassword from './Components/Authentication/ResetPassword.jsx'
import StudentLayout from './Components/StudentDashboard/StudentLayout.jsx'
import DashboardHome from './Components/StudentDashboard/DashboardHome.jsx'
import Forum from './Components/StudentDashboard/Forum.jsx'
import Alumni from './Components/StudentDashboard/Alumni.jsx'
import Jobs from './Components/StudentDashboard/Jobs.jsx'
import Events from './Components/StudentDashboard/Events.jsx'
import Messages from './Components/StudentDashboard/Messages.jsx'
import Requests from './Components/StudentDashboard/Requests.jsx'

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
      path: '/otp-verification/:email/:phone',
      element: <OtpVerification />,
    },
    {
      path: '/password/reset/:token',
      element: <ResetPassword />,
    },
    {
      path: '/student',
      element: <StudentLayout />,
      children: [
        {
          path: 'dashboard',
          element: <DashboardHome />,
        },
        {
          path: 'forum',
          element: <Forum />,
        },
        {
          path: 'alumni',
          element: <Alumni />,
        },
        {
          path: 'jobs',
          element: <Jobs />,
        },
        {
          path: 'events',
          element: <Events />,
        },
        {
          path: 'messages',
          element: <Messages />,
        },
        {
          path: 'requests',
          element: <Requests />,
        },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App