import { useState } from 'react'
import './App.css'
import Login from './Components/Login.jsx'
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
    element:<Login/>
  }
])

  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
