import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import ReceptionStatus from "../components/ReceptionStatus";
import "../styles/HotelOperations.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Checked In", label: "Checked In" },
    { value: "Checked Out", label: "Checked Out" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "No Show", label: "No Show" }
];

const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
});

const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

export default function BillingPayments() {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [receiptBooking, setReceiptBooking] = useState(null);

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBookings(response.data?.bookings || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load billing records.");
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
            const matchesStatus = !status || booking.bookingStatus === status;
            const roomName = booking.room?.name || "";
            const matchesSearch = !query || [booking.guestName, booking.guestEmail, booking.bookingReference, roomName]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

            return matchesStatus && matchesSearch;
        });
    }, [bookings, search, status]);

    const totals = useMemo(() => {
        return filteredBookings.reduce((summary, booking) => {
            const amount = Number(booking.totalAmount || 0);
            summary.revenue += booking.paymentStatus === "Paid" ? amount : 0;
            summary.unpaid += booking.paymentStatus !== "Paid" ? amount : 0;
            summary.checkedIn += booking.bookingStatus === "Checked In" ? 1 : 0;
            summary.checkedOut += booking.bookingStatus === "Checked Out" ? 1 : 0;
            return summary;
        }, { revenue: 0, unpaid: 0, checkedIn: 0, checkedOut: 0 });
    }, [filteredBookings]);

    const updateBooking = async (booking, updates) => {
        setSavingId(booking._id);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`${API_URL}/bookings/${booking._id}`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updated = response.data?.booking;
            setBookings((current) => current.map((item) => item._id === booking._id ? updated : item));
            setSuccess("Booking updated successfully.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update booking.");
        } finally {
            setSavingId("");
        }
    };

    return (
        <section className="operations-page">
            <div className="operations-header">
                <div>
                    <span className="operations-kicker">FRONT DESK</span>
                    <h2>Check-In, Check-Out, Billing & Payment</h2>
                    <p>Monitor arrivals, departures, payment status, and printable billing details.</p>
                </div>
                <Tooltip title="Refresh records">
                    <IconButton className="operations-icon-button" onClick={loadBookings}><RefreshRoundedIcon /></IconButton>
                </Tooltip>
            </div>

            <div className="row g-3 operations-stats">
                <div className="col-12 col-md-3"><div className="operations-stat"><span>Paid Revenue</span><strong>{currency.format(totals.revenue)}</strong></div></div>
                <div className="col-12 col-md-3"><div className="operations-stat"><span>Unpaid Balance</span><strong>{currency.format(totals.unpaid)}</strong></div></div>
                <div className="col-12 col-md-3"><div className="operations-stat"><span>Checked In</span><strong>{totals.checkedIn}</strong></div></div>
                <div className="col-12 col-md-3"><div className="operations-stat"><span>Checked Out</span><strong>{totals.checkedOut}</strong></div></div>
            </div>

            <div className="operations-toolbar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search guest, email, reference, room" />
                <FilterDropdown value={status} onChange={setStatus} options={statusOptions} label="All Status" />
            </div>

            {error && <Alert severity="error" className="mb-3">{error}</Alert>}
            {success && <Alert severity="success" className="mb-3" onClose={() => setSuccess("")}>{success}</Alert>}

            <div className="operations-table-wrap">
                {loading ? (
                    <div className="operations-state"><CircularProgress size={30} /><p>Loading billing records...</p></div>
                ) : filteredBookings.length === 0 ? (
                    <div className="operations-state"><ReceiptLongRoundedIcon /><p>No billing records found.</p></div>
                ) : (
                    <table className="table table-hover align-middle operations-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Stay</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td>
                                        <strong>{booking.guestName}</strong>
                                        <span>{booking.bookingReference}</span>
                                        <small>{booking.room?.name || "Room not assigned"}</small>
                                    </td>
                                    <td>
                                        <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                                        <small>{booking.totalNights || 0} night(s)</small>
                                    </td>
                                    <td><ReceptionStatus status={booking.bookingStatus} /></td>
                                    <td><Chip label={booking.paymentStatus} size="small" className={`payment-chip ${String(booking.paymentStatus).toLowerCase().replace(/\s+/g, "-")}`} /></td>
                                    <td><strong>{currency.format(Number(booking.totalAmount || 0))}</strong></td>
                                    <td>
                                        <div className="operations-actions">
                                            <Button size="small" variant="outlined" startIcon={<LoginRoundedIcon />} disabled={savingId === booking._id || !["Pending", "Confirmed"].includes(booking.bookingStatus)} onClick={() => updateBooking(booking, { bookingStatus: "Checked In" })}>Check In</Button>
                                            <Button size="small" variant="outlined" startIcon={<LogoutRoundedIcon />} disabled={savingId === booking._id || booking.bookingStatus !== "Checked In"} onClick={() => updateBooking(booking, { bookingStatus: "Checked Out", paymentStatus: booking.paymentStatus === "Unpaid" ? "Partially Paid" : booking.paymentStatus })}>Check Out</Button>
                                            <Button size="small" variant="contained" startIcon={<PaymentsRoundedIcon />} disabled={savingId === booking._id || booking.paymentStatus === "Paid"} onClick={() => updateBooking(booking, { paymentStatus: "Paid" })}>Paid</Button>
                                            <Button size="small" variant="text" onClick={() => setReceiptBooking(booking)}>Receipt</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={Boolean(receiptBooking)} onClose={() => setReceiptBooking(null)} fullWidth maxWidth="sm">
                <DialogTitle>Billing Receipt</DialogTitle>
                <DialogContent>
                    {receiptBooking && (
                        <div className="receipt-panel">
                            <div><span>Guest</span><strong>{receiptBooking.guestName}</strong></div>
                            <div><span>Reference</span><strong>{receiptBooking.bookingReference}</strong></div>
                            <div><span>Room</span><strong>{receiptBooking.room?.name || "Room not assigned"}</strong></div>
                            <div><span>Stay</span><strong>{formatDate(receiptBooking.checkIn)} - {formatDate(receiptBooking.checkOut)}</strong></div>
                            <div><span>Booking Status</span><StatusBadge status={receiptBooking.bookingStatus} /></div>
                            <div><span>Payment Status</span><strong>{receiptBooking.paymentStatus}</strong></div>
                            <div className="receipt-total"><span>Total Amount</span><strong>{currency.format(Number(receiptBooking.totalAmount || 0))}</strong></div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceiptBooking(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}
