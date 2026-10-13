
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import ReceptionistProfile from "./pages/ReceptionistProfile";
import ReceptionReservations from "./pages/ReceptionReservations";
import ReservationForm from "./pages/ReservationForm";
import BillingPayments from "./pages/BillingPayments";
import Reports from "./pages/Reports";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
                    <Route path="/receptionist/reservations" element={<ReceptionReservations />} />
                    <Route path="/receptionist/reservations/new" element={<ReservationForm />} />
                    <Route path="/receptionist/billing" element={<BillingPayments />} />
                    <Route path="/receptionist/reports" element={<Reports />} />

                    <Route path="/receptionist-profile" element={<ReceptionistProfile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;