import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import Home from '../pages/Home'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import { MapPage } from '../pages/Map.Page'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
     path: '/mapa', 
    element: <MapPage /> 
  }
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
