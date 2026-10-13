import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Button, CircularProgress, IconButton, TextField, Tooltip } from "@mui/material";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RoomServiceRoundedIcon from "@mui/icons-material/RoomServiceRounded";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import "../styles/HotelOperations.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const requestFilters = [
    { value: "with-requests", label: "With Requests" },
    { value: "no-requests", label: "No Requests" },
    { value: "active", label: "Active Stay" },
    { value: "done", label: "Completed Stay" }
];

const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

export default function GuestRequests() {
    const [bookings, setBookings] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("with-requests");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data?.bookings || [];

            setBookings(data);
            setDrafts(Object.fromEntries(data.map((booking) => [booking._id, booking.specialRequests || ""])));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load guest requests.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        return bookings.filter((booking) => {
            const hasRequest = Boolean((booking.specialRequests || "").trim());
            const matchesFilter =
                !filter ||
                (filter === "with-requests" && hasRequest) ||
                (filter === "no-requests" && !hasRequest) ||
                (filter === "active" && ["Pending", "Confirmed", "Checked In"].includes(booking.bookingStatus)) ||
                (filter === "done" && ["Checked Out", "Cancelled", "No Show"].includes(booking.bookingStatus));
            const matchesSearch = !query || [booking.guestName, booking.guestEmail, booking.bookingReference, booking.room?.name, booking.specialRequests]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

            return matchesFilter && matchesSearch;
        });
    }, [bookings, filter, search]);

    const saveRequest = async (booking) => {
        setSavingId(booking._id);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`${API_URL}/bookings/${booking._id}`, {
                specialRequests: drafts[booking._id] || ""
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updated = response.data?.booking;
            setBookings((current) => current.map((item) => item._id === booking._id ? updated : item));
            setDrafts((current) => ({ ...current, [booking._id]: updated.specialRequests || "" }));
            setSuccess("Guest request updated.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update guest request.");
        } finally {
            setSavingId("");
        }
    };

    return (
        <section className="operations-page">
            <div className="operations-header">
                <div>
                    <span className="operations-kicker">GUEST SERVICE</span>
                    <h2>Guest Requests</h2>
                    <p>Track special requests linked to each reservation.</p>
                </div>
                <Tooltip title="Refresh requests">
                    <IconButton className="operations-icon-button" onClick={loadBookings}><RefreshRoundedIcon /></IconButton>
                </Tooltip>
            </div>

            <div className="operations-toolbar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search guest, room, or request" />
                <FilterDropdown value={filter} onChange={setFilter} options={requestFilters} label="Request Filter" />
            </div>

            {error && <Alert severity="error" className="mb-3">{error}</Alert>}
            {success && <Alert severity="success" className="mb-3" onClose={() => setSuccess("")}>{success}</Alert>}

            {loading ? (
                <div className="operations-state"><CircularProgress size={30} /><p>Loading guest requests...</p></div>
            ) : filteredBookings.length === 0 ? (
                <div className="operations-state"><RoomServiceRoundedIcon /><p>No guest requests found.</p></div>
            ) : (
                <div className="row g-3">
                    {filteredBookings.map((booking) => (
                        <div className="col-12 col-xl-6" key={booking._id}>
                            <article className="request-card">
                                <div className="request-card-header">
                                    <div>
                                        <h3>{booking.guestName}</h3>
                                        <span>{booking.room?.name || "Room not assigned"} | {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                                    </div>
                                    <StatusBadge status={booking.bookingStatus} />
                                </div>
                                <TextField
                                    label="Special Request"
                                    value={drafts[booking._id] || ""}
                                    onChange={(event) => setDrafts((current) => ({ ...current, [booking._id]: event.target.value }))}
                                    multiline
                                    minRows={3}
                                    fullWidth
                                />
                                <div className="request-card-footer">
                                    <span>{booking.bookingReference}</span>
                                    <Button variant="contained" startIcon={<DoneAllRoundedIcon />} disabled={savingId === booking._id} onClick={() => saveRequest(booking)}>Save Request</Button>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
