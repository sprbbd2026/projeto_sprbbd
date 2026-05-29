import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainPage from "./pages/MainPage";
import SatellitePage from "./pages/SatellitePage";
import SatelliteRegisterPage from "./pages/SatelliteRegisterPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SatelliteEditPage from "./pages/SatelliteEditPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function Layout() {
  const location = useLocation();

  // rotas sem navbar
  const hideNavbarRoutes = ["/login", "/register", "/"];

  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/satellite" element={<PrivateRoute><SatellitePage /></PrivateRoute>} />
          <Route path="/register-satellite" element={<PrivateRoute><SatelliteRegisterPage /></PrivateRoute>} />
          <Route path="/satellites/edit/:id" element={<PrivateRoute><SatelliteEditPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><MainPage /></PrivateRoute>} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}