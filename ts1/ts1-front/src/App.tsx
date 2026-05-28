import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainPage from "./pages/MainPage";
import SatellitePage from "./pages/SatellitePage";
import SatelliteRegisterPage from "./pages/SatelliteRegisterPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SatelliteEditPage from "./pages/SatelliteEditPage";
import ConstellationPage from "./pages/ConstellationPage";
import ConstellationRegisterPage from "./pages/ConstellationRegisterPage";
import ConstellationEditPage from "./pages/ConstellationEditPage";


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
          <Route path="/satellite" element={<SatellitePage />} />
          <Route path="/register-satellite" element={<SatelliteRegisterPage />} />
          <Route path="/satellites/edit/:id" element={<SatelliteEditPage />} />
          <Route path="/constellation" element={<ConstellationPage />} />
          <Route path="/register-constellation" element={<ConstellationRegisterPage />} />
          <Route path="/constellations/edit/:id" element={<ConstellationEditPage />} />
          <Route path="/dashboard" element={<MainPage />} />
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