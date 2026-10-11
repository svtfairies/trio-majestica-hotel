import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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

const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardRoundedIcon /> },
    { label: "Reservations", path: "/reservations", icon: <CalendarMonthRoundedIcon /> },
    { label: "Guests", path: "/guests", icon: <PeopleAltRoundedIcon /> },
    { label: "Room Management", path: "/rooms", icon: <BedRoundedIcon /> },
    { label: "Billing & Payments", path: "/billing", icon: <ReceiptLongRoundedIcon /> },
    { label: "Inventory", path: "/inventory", icon: <Inventory2RoundedIcon /> },
    { label: "Reports", path: "/reports", icon: <AssessmentRoundedIcon /> },
    { label: "Notifications", path: "/notifications", icon: <NotificationsRoundedIcon /> }
];

export default function Sidebar({
    onLogout,
    receptionistName = "Receptionist",
    receptionistRole = "Front Desk Staff",
    receptionistImage = ""
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleNavigation = () => setMobileOpen(false);

    const handleLogout = () => {
        setLogoutModalOpen(false);
        setMobileOpen(false);

        if (onLogout) {
            onLogout();
        } else {
            navigate("/login");
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
                        <NavLink key={item.path} to={item.path} onClick={handleNavigation} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
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
                <DialogTitle id="logout-dialog-title" className="logout-dialog-title">
                    <span className="logout-dialog-icon"><WarningAmberRoundedIcon /></span>
                    Confirm Logout
                    <IconButton className="logout-dialog-close" onClick={() => setLogoutModalOpen(false)} aria-label="Close logout dialog"><CloseRoundedIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <p id="logout-dialog-description" className="logout-dialog-message">Are you sure you want to log out of your account?</p>
                </DialogContent>
                <DialogActions className="logout-dialog-actions">
                    <Button onClick={() => setLogoutModalOpen(false)} variant="outlined" className="logout-cancel-button">Cancel</Button>
                    <Button onClick={handleLogout} variant="contained" className="logout-confirm-button" startIcon={<LogoutRoundedIcon />}>Yes, Logout</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}