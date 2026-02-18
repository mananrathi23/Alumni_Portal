import { useState } from 'react'
import Auth from './Components/Auth.jsx'
import MainPage from './Components/MainPage.jsx'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'

function App() {
const router = createBrowserRouter([
  {
    path:'/',
    element:<MainPage/>
  },
  {
    path:'/login',
    element:<Auth/>
  }
])

  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
