import Auth from "./Components/Auth.jsx";
import MainPage from "./Components/MainPage.jsx";
import StudentLayout from "./Components/StudentDashboard/StudentLayout.jsx";
import DashboardHome from "./Components/StudentDashboard/DashboardHome.jsx";
import Forum from "./Components/StudentDashboard/Forum.jsx";
import Alumni from "./Components/StudentDashboard/Alumni.jsx";
// import Jobs from "./Components/StudentDashboard/Jobs.jsx";
// import Events from "./Components/StudentDashboard/Events.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainPage />,
    },
    {
      path: "/login",
      element: <Auth />,
    },
    {
      path: "/student",
      element: <StudentLayout />,
      children: [
        {
          path: "dashboard",
          element: <DashboardHome />,
        },
        {
          path: "forum",
          element: <Forum />,
        },
        {
          path: "alumni",
          element: <Alumni />,
        },
        // {
        //   path: "jobs",
        //   element: <Jobs />,
        // },
        // {
        //   path: "events",
        //   element: <Events />,
        // },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;