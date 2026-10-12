
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

function ProtectedRoute() {
    const [authenticated, setAuthenticated] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        let active = true;

        const verifySession = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                if (active) setCheckingSession(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const user = response.data?.user || response.data?.data?.user || response.data?.data;

                if (!user || user.role !== "receptionist") {
                    throw new Error("Invalid receptionist session.");
                }

                if (active) {
                    localStorage.setItem("user", JSON.stringify(user));
                    setAuthenticated(true);
                }
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                if (active) setAuthenticated(false);
            } finally {
                if (active) setCheckingSession(false);
            }
        };

        verifySession();

        return () => {
            active = false;
        };
    }, []);

    if (checkingSession) {
        return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Checking session...</div>;
    }

    return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;