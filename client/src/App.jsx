import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RoomManagement from "./pages/RoomManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<RoomManagement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/rooms" element={<RoomManagement/>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;