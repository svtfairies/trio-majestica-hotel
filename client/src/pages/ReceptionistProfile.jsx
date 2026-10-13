
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Sidebar from "../components/Sidebar";
import "../styles/ReceptionistProfile.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const getProfileData = (response) => {
    const data = response?.data?.user || response?.data?.data?.user || response?.data?.data || response?.data;

    return {
        id: data?.id || data?._id || "",
        name: data?.name || "",
        email: data?.email || "",
        phone: data?.phone || data?.phoneNumber || "",
        address: data?.address || "",
        role: data?.role || "receptionist",
        status: data?.status || "Active",
        createdAt: data?.createdAt || null
    };
};

export default function ReceptionistProfile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getHeaders = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Your session has expired. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    }, []);

    const handleSessionError = useCallback((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
            return true;
        }

        return false;
    }, [navigate]);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });

            const data = getProfileData(response);

            if (!data.id && !data.email) {
                throw new Error("The server returned incomplete profile information.");
            }

            setProfile(data);
            setForm({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address
            });

            localStorage.setItem("user", JSON.stringify(data));
        } catch (err) {
            if (!handleSessionError(err)) {
                setError(
                    err?.response?.data?.message || err.message || "Unable to load your profile."
                );
            }
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleSessionError]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleChange = (event) => {
        setForm((previous) => ({
            ...previous,
            [event.target.name]: event.target.value
        }));

        setError("");
        setSuccess("");
    };

    const handleCancel = () => {
        setForm({
            name: profile?.name || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            address: profile?.address || ""
        });

        setEditing(false);
        setError("");
        setSuccess("");
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const payload = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            address: form.address.trim()
        };

        if (!payload.name || !payload.email) {
            setError("Full name and email address are required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setSaving(true);

        try {
            const response = await axios.patch(
                `${API_URL}/auth/me`,
                payload,
                { headers: { ...getHeaders(), "Content-Type": "application/json" } }
            );

            const returned = getProfileData(response);
            const updated = {
                ...profile,
                ...payload,
                ...returned,
                id: returned.id || profile.id,
                name: returned.name || payload.name,
                email: returned.email || payload.email,
                phone: returned.phone || payload.phone,
                address: returned.address || payload.address
            };

            setProfile(updated);
            setForm({
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                address: updated.address
            });

            localStorage.setItem("user", JSON.stringify(updated));
            setEditing(false);
            setSuccess("Your profile has been updated successfully.");
        } catch (err) {
            if (!handleSessionError(err)) {
                setError(
                    err?.response?.data?.message ||
                    "Unable to update your profile. Check your backend endpoint and database fields."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError("");

        try {
            await axios.delete(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        } catch (err) {
            if (!handleSessionError(err)) {
                setError(err?.response?.data?.message || "Unable to delete your account. Please try again.");
                setDeleteOpen(false);
            }
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return "Not available";

        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? "Not available"
            : date.toLocaleDateString("en-PH", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
    };

    const initials = (profile?.name || "Receptionist")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    if (loading) {
        return (
            <div className="rp-screen-loading">
                <CircularProgress />
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="rp-app-layout">
            <Sidebar receptionistName={profile?.name || "Receptionist"} receptionistRole="Receptionist" />

            <main className="rp-main-content">
                <div className="rp-container">
                    <header className="rp-page-header">
                        <div>
                            <h1>My Profile</h1>
                            <p>Manage your personal information.</p>
                        </div>

                        <Button className="rp-refresh-button" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={loadProfile}>
                            Refresh
                        </Button>
                    </header>

                    {error && (
                        <Alert severity="error" className="rp-alert" onClose={() => setError("")} >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" className="rp-alert" onClose={() => setSuccess("")}>
                            {success}
                        </Alert>
                    )}

                    {profile && (
                        <div className="rp-profile-grid">
                            <section className="rp-card rp-profile-overview">
                                <div className="rp-profile-banner">
                                    <span>STAFF PROFILE</span>
                                </div>

                                <Avatar className="rp-profile-avatar">
                                    {initials || <PersonOutlineRoundedIcon />}
                                </Avatar>

                                <h2>{profile.name || "Receptionist"}</h2>
                                <p className="rp-profile-email">{profile.email || "No email provided"}</p>

                                <span className="rp-role-label">Receptionist</span>

                                <div className="rp-overview-divider" />

                                <div className="rp-overview-item">
                                    <span>Account Status</span>
                                    <strong className={String(profile.status).toLowerCase() === "active" ? "rp-active" : "rp-inactive"}>
                                        <span className="rp-status-dot" />
                                        {profile.status}
                                    </strong>
                                </div>

                                <div className="rp-overview-item">
                                    <span>Member Since</span>
                                    <strong>{formatDate(profile.createdAt)}</strong>
                                </div>

                                <div className="rp-overview-item">
                                    <span>Account Role</span>
                                    <strong>Receptionist</strong>
                                </div>

                                <div className="rp-overview-divider" />

                                <div className="rp-security-note">
                                    <ShieldOutlinedIcon />
                                    <div>
                                        <strong>Account Security</strong>
                                        <p>Your account information is available to you while signed in.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rp-card rp-profile-details">
                                <div className="rp-details-header">
                                    <div>
                                        <h2>Personal Information</h2>
                                        <p>Keep your contact details up to date.</p>
                                    </div>

                                    {!editing && (
                                        <Button variant="outlined" className="rp-edit-button"
                                            startIcon={<EditRoundedIcon />}
                                            onClick={() => {
                                                setEditing(true);
                                                setError("");
                                                setSuccess("");
                                            }}
                                        >
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>

                                <form onSubmit={handleUpdate}>
                                    <div className="rp-form-section">
                                        <h3>Basic Information</h3>

                                        <div className="rp-form-grid">
                                            <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} required fullWidth disabled={!editing} inputProps={{ maxLength: 100 }} />
                                            <TextField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth disabled={!editing} inputProps={{ maxLength: 254 }} />
                                        </div>
                                    </div>

                                    <div className="rp-form-section">
                                        <h3>Contact Information</h3>

                                        <div className="rp-form-grid">
                                            <TextField label="Contact Number" name="phone" value={form.phone} onChange={handleChange} fullWidth disabled={!editing} placeholder="Enter your contact number" inputProps={{ maxLength: 25 }} />
                                            <TextField label="Home Address" name="address" value={form.address} onChange={handleChange} fullWidth disabled={!editing} placeholder="Enter your home address" inputProps={{ maxLength: 250 }} />
                                        </div>
                                    </div>

                                    {editing && (
                                        <div className="rp-form-actions">
                                            <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                                                Cancel
                                            </Button>

                                            <Button type="submit" variant="contained" className="rp-save-button" disabled={saving}>
                                                {saving ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    )}
                                </form>

                                <section className="rp-danger-section">
                                    <div className="rp-danger-header">
                                        <div className="rp-danger-icon"><DeleteOutlineRoundedIcon /></div>
                                        <div className="rp-danger-copy">
                                            <h3>Delete Account</h3>
                                            <p>Once you delete your account, all associated account access will be permanently removed. This action cannot be undone.</p>
                                        </div>
                                    </div>
                                    <div className="rp-danger-footer">
                                        <span className="rp-danger-warning">This action is permanent.</span>
                                        <Button variant="contained" color="error" className="rp-delete-button" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteOpen(true)}>Delete Account</Button>
                                    </div>
                                </section>
                            </section>
                        </div>
                    )}
                </div>
            </main>


            <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ className: "rp-delete-dialog" }}>
                <DialogContent className="rp-delete-dialog-content">
                    <div className="rp-delete-dialog-icon"><DeleteOutlineRoundedIcon /></div>
                    <DialogTitle className="rp-delete-dialog-title">Delete Account?</DialogTitle>
                    <DialogContentText className="rp-delete-dialog-message">Are you sure you want to permanently delete your receptionist account? This action cannot be undone, and you will lose access to your account.</DialogContentText>
                    <div className="rp-delete-dialog-warning"><WarningAmberRoundedIcon /><span>Your account will be permanently removed.</span></div>
                </DialogContent>
                <DialogActions className="rp-delete-dialog-actions">
                    <Button onClick={() => setDeleteOpen(false)} disabled={deleting} className="rp-delete-cancel-button">Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting} className="rp-delete-confirm-button">{deleting ? "Deleting..." : "Yes, Delete Account"}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}