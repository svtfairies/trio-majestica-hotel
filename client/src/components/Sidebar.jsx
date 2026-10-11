
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Sidebar.css";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import BedRoundedIcon from "@mui/icons-material/BedRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const menuItems = [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: <DashboardRoundedIcon /> },
    { label: "Reservations", path: "/reservations", icon: <CalendarMonthRoundedIcon /> },
    { label: "Guests", path: "/guests", icon: <PeopleAltRoundedIcon /> },
    { label: "Room Management", path: "/rooms", icon: <BedRoundedIcon /> },
    { label: "Billing & Payments", path: "/billing", icon: <ReceiptLongRoundedIcon /> },
    { label: "Inventory", path: "/inventory", icon: <Inventory2RoundedIcon /> },
    { label: "Reports", path: "/reports", icon: <AssessmentRoundedIcon /> },
    { label: "Notifications", path: "/notifications", icon: <NotificationsRoundedIcon /> }
];

export default function Sidebar({ onLogout }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [receptionist, setReceptionist] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        const fetchReceptionist = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const user = response.data?.user || response.data?.data?.user;

                if (!user || user.role !== "receptionist") {
                    throw new Error("Invalid receptionist account.");
                }

                if (active) {
                    setReceptionist(user);
                    localStorage.setItem("user", JSON.stringify(user));
                }
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403 || error.message === "Invalid receptionist account.") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                    return;
                }

                const cachedUser = localStorage.getItem("user");

                if (cachedUser && active) {
                    try {
                        const user = JSON.parse(cachedUser);

                        if (user.role === "receptionist") {
                            setReceptionist(user);
                        }
                    } catch {
                        localStorage.removeItem("user");
                    }
                }

                console.error("Unable to fetch receptionist profile:", error);
            }
        };

        fetchReceptionist();

        return () => {
            active = false;
        };
    }, [navigate]);

    const receptionistName = receptionist?.name || "Loading profile...";
    const receptionistRole = receptionist?.role === "receptionist" ? "Front Desk Staff" : "";
    const receptionistImage = receptionist?.profileImage || receptionist?.avatar || "";

    const handleNavigation = () => {
        setMobileOpen(false);
    };

    const handleLogout = () => {
        setLogoutModalOpen(false);
        setMobileOpen(false);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (onLogout) {
            onLogout();
        } else {
            navigate("/login", { replace: true });
        }
    };

    return (
        <>
            <button className="sidebar-mobile-toggle" type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
                {mobileOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
            </button>

            {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

            <aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon"><ApartmentRoundedIcon /></div>
                    <div className="sidebar-brand-text">
                        <h5>Trio Majestica</h5>
                        <span>Hotel Management System</span>
                    </div>
                    <button className="sidebar-close-button" type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><CloseRoundedIcon /></button>
                </div>

                <div className="sidebar-section-label">MAIN MENU</div>

                <nav className="sidebar-navigation" aria-label="Main navigation">
                    {menuItems.map((item) => (
                    <NavLink key={item.path} to={item.path} end onClick={handleNavigation} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                        <span className="sidebar-link-icon">{item.icon}</span>
                        <span className="sidebar-link-label">{item.label}</span>
                    </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <NavLink to="/profile" onClick={handleNavigation} className="sidebar-profile">
                        <Avatar src={receptionistImage || undefined} alt={receptionistName} className="sidebar-profile-avatar">
                            {!receptionistImage && <PersonRoundedIcon />}
                        </Avatar>
                        <div className="sidebar-profile-info">
                            <strong>{receptionistName}</strong>
                            <span>{receptionistRole}</span>
                        </div>
                        <span className="sidebar-profile-indicator" title="Account profile" />
                    </NavLink>

                    <button className="sidebar-logout" type="button" onClick={() => setLogoutModalOpen(true)}>
                        <LogoutRoundedIcon />
                        <span>Logout</span>
                    </button>

                    <div className="sidebar-footer">Trio Majestica Hotel © 2026</div>
                </div>
            </aside>


            <Dialog open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} aria-labelledby="logout-dialog-title" aria-describedby="logout-dialog-description" fullWidth maxWidth="xs" PaperProps={{ className: "logout-dialog-paper" }}>
                <DialogContent className="logout-dialog-content">
                    <div className="logout-dialog-icon">
                        <LogoutRoundedIcon />
                    </div>
                    
                    <DialogTitle id="logout-dialog-title" className="logout-dialog-title">Ready to leave?</DialogTitle>
                    <p id="logout-dialog-description" className="logout-dialog-message">Are you sure you want to log out of your account?</p>
                </DialogContent>

                <DialogActions className="logout-dialog-actions">
                    <Button onClick={() => setLogoutModalOpen(false)} variant="outlined" className="logout-cancel-button" fullWidth>Stay Logged In</Button>
                    <Button onClick={handleLogout} variant="contained" className="logout-confirm-button" startIcon={<LogoutRoundedIcon />} fullWidth>Yes, Log Out</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}