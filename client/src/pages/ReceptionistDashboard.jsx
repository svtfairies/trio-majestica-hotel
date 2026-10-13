import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Alert, Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Tooltip } from "@mui/material";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Sidebar from "../components/Sidebar";
import FilterDropdown from "../components/FilterDropdown";
import ReceptionStatus from "../components/ReceptionStatus";
import StatusBadge from "../components/StatusBadge";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import "../styles/ReceptionistDashboard.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const STATUS_OPTIONS = [
    { value: "Pending", label: "Pending" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Checked In", label: "Checked In" },
    { value: "Checked Out", label: "Checked Out" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "No Show", label: "No Show" }
];

const STATUS_STYLES = {
    pending: { dot: "#f97316" },
    confirmed: { dot: "#22c55e" },
    checkedin: { dot: "#3b82f6" },
    checkedout: { dot: "#64748b" },
    cancelled: { dot: "#ef4444" },
    noshow: { dot: "#ec4899" }
};

const normalizeStatus = (value = "") =>
    String(value).toLowerCase().replace(/[\s_-]/g, "");

const getStatus = (booking) => {
    const value = booking.status || booking.bookingStatus || booking.reservationStatus || "Pending";
    const key = normalizeStatus(value);
    const labels = {
        pending: "Pending",
        confirmed: "Confirmed",
        checkedin: "Checked In",
        checkedout: "Checked Out",
        cancelled: "Cancelled",
        canceled: "Cancelled",
        noshow: "No Show"
    };

    return {
        key,
        label: labels[key] || String(value),
        dot: (STATUS_STYLES[key] || STATUS_STYLES.pending).dot
    };
};

const getId = (booking) => booking._id || booking.id || booking.bookingId || booking.reservationId || "";
const getGuestName = (booking) => booking.guestName || booking.fullName || booking.name || booking.customerName || booking.user?.name || booking.guest?.name || "Guest";
const getEmail = (booking) => booking.email || booking.guestEmail || booking.emailAddress || booking.user?.email || "Not provided";
const getPhone = (booking) => booking.phone || booking.phoneNumber || booking.guestPhone || booking.user?.phone || "Not provided";

const getRoom = (booking) => {
    const room = booking.room || booking.roomId || booking.roomNumber || booking.roomName || booking.roomType;

    if (room && typeof room === "object") {
        return room.roomNumber || room.number || room.name || room.roomType || room.type || "Room assigned";
    }

    return room ? String(room) : "Not assigned";
};

const getCheckIn = (booking) => booking.checkInDate || booking.checkIn || booking.arrivalDate || booking.bookingDate || booking.date || booking.startDate || "";
const getCheckOut = (booking) => booking.checkOutDate || booking.checkOut || booking.departureDate || booking.endDate || "";
const getTime = (booking) => booking.checkInTime || booking.arrivalTime || booking.time || "";

const getAmount = (booking) => {
    const value = booking.totalAmount ?? booking.totalPrice ?? booking.amount ?? booking.price;
    const amount = Number(value);

    return value === null || value === undefined || value === "" || !Number.isFinite(amount) ? 0 : amount;
};

const toDateKey = (value) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value);

    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
    ).padStart(2, "0")}`;
};

const parseDate = (value) => {
    if (!value) return null;

    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value);

    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
    const date = parseDate(value);

    return date ? date.toLocaleDateString("en-PH", {month: "short", day: "numeric", year: "numeric"}) : "Not provided";
};

const formatMonth = (date) =>
    date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);

const formatTime = (value, type = "checkin") => {
    const defaultTime = type === "checkout" ? "2:00 PM" : "10:00 AM";

    if (!value) return defaultTime;

    if (/^\d{1,2}:\d{2}$/.test(String(value))) {
        const [hours, minutes] = String(value).split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime()) && String(value).includes("T") ? date.toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"}) : String(value);
};

const getInitials = (name) =>
    String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "G";

const getRecords = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.bookings)) return payload.bookings;
    if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
    if (Array.isArray(payload?.reservations)) return payload.reservations;
    if (Array.isArray(payload?.data?.reservations)) return payload.data.reservations;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;

    return null;
};

const isRevenueBooking = (booking) => !["cancelled", "canceled", "noshow"].includes(getStatus(booking).key);

const getBookingDisplayId = (booking) => {
    const rawId = booking.bookingCode || booking.bookingNumber || booking.bookingId || booking.reservationId || booking._id || booking.id;
    const value = String(rawId || "").trim();
    if (!value) return "TM-000000";
    return value.toUpperCase().startsWith("TM-") ? value : `TM-${value.slice(-6).toUpperCase()}`;
};

function RevenueChart({ bookings, currentMonth }) {
    const [period, setPeriod] = useState("weekly");
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const data = useMemo(() => {
        const year = currentMonth.getFullYear();
        const monthIndex = currentMonth.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDay = new Date(year, monthIndex, 1);
        const firstMondayOffset = (firstDay.getDay() + 6) % 7;
        const weekCount = Math.ceil((firstMondayOffset + daysInMonth) / 7);

        const weekly = Array.from({ length: weekCount }, (_, index) => {
            const startDay = index * 7 - firstMondayOffset + 1;
            const start = new Date(year, monthIndex, startDay);
            const end = new Date(year, monthIndex, startDay + 6);

            return {
                key: `week-${index + 1}`,
                label: `Week ${index + 1}`,
                detail: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`,
                start: toDateKey(start),
                end: toDateKey(end),
                value: 0
            };
        });

        const monthly = Array.from({ length: 12 }, (_, index) => ({
            key: `month-${index + 1}`,
            label: new Date(year, index, 1).toLocaleDateString("en-PH", { month: "short" }),
            detail: new Date(year, index, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
            month: index,
            value: 0
        }));

        bookings.filter(isRevenueBooking).forEach((booking) => {
            const date = parseDate(toDateKey(getCheckIn(booking)));
            if (!date) return;

            if (date.getFullYear() === year && date.getMonth() === monthIndex) {
                const weekIndex = Math.floor((date.getDate() + firstMondayOffset - 1) / 7);
                if (weekly[weekIndex]) weekly[weekIndex].value += getAmount(booking);
            }

            if (date.getFullYear() === year) monthly[date.getMonth()].value += getAmount(booking);
        });

        return { weekly, monthly };
    }, [bookings, currentMonth]);

    const rows = data[period];
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const max = Math.max(1, ...rows.map((row) => row.value));
    const chartPoints = rows.map((row, index) => {
        const x = 18 + (index * 324) / Math.max(1, rows.length - 1);
        const y = 190 - (row.value / max) * 155;
        return `${x},${y}`;
    }).join(" ");

    const selectedBookingCount = selectedPeriod ? bookings.filter((booking) => {
        if (!isRevenueBooking(booking)) return false;
        const date = parseDate(toDateKey(getCheckIn(booking)));
        if (!date || date.getFullYear() !== currentMonth.getFullYear()) return false;
        return period === "weekly" ? toDateKey(date) >= selectedPeriod.start && toDateKey(date) <= selectedPeriod.end : date.getMonth() === selectedPeriod.month;
    }).length : 0;

    return (
        <Paper className="rd-analytics-card rd-revenue-chart-card" elevation={0}>
            <div className="rd-analytics-heading">
                <div>
                    <h2>Revenue Performance</h2>
                    <p>{period === "weekly" ? `Weekly revenue for ${formatMonth(currentMonth)}` : `Monthly revenue for ${currentMonth.getFullYear()}`}</p>
                </div>
                <div className="rd-chart-switch">
                    <button type="button" className={period === "weekly" ? "active" : ""} onClick={() => { setPeriod("weekly"); setSelectedPeriod(null); }}>Weekly</button>
                    <button type="button" className={period === "monthly" ? "active" : ""} onClick={() => { setPeriod("monthly"); setSelectedPeriod(null); }}>Monthly</button>
                </div>
            </div>

            <div className="rd-chart-total">
                {formatCurrency(total)}
                <span>{period === "weekly" ? "Total revenue for the selected month" : `Total revenue for ${currentMonth.getFullYear()}`}</span>
            </div>

            <div className="rd-bar-chart rd-revenue-bars">
                {rows.map((row) => (
                    <button type="button" className="rd-bar-group" key={row.key} title={`${row.label}: ${formatCurrency(row.value)}`} onClick={() => setSelectedPeriod(row)}>
                        <div className="rd-bars">
                            {row.value > 0 && <span className="rd-bar rd-bar-revenue" style={{ height: `${(row.value / max) * 100}%` }} />}
                        </div>
                    </button>
                ))}
            </div>

            <div className={`rd-chart-labels ${period === "monthly" ? "rd-month-labels" : ""}`}>
                {rows.map((row) => <button type="button" key={row.key} title={row.detail} onClick={() => setSelectedPeriod(row)}>{row.label}</button>)}
            </div>

            <p className="rd-chart-note">Select a point or period label to view revenue details. Cancelled and no-show bookings are excluded.</p>

            <Dialog open={Boolean(selectedPeriod)} onClose={() => setSelectedPeriod(null)} fullWidth maxWidth="sm">
                <DialogTitle className="rd-revenue-dialog-title">
                    <span>{selectedPeriod ? `${selectedPeriod.label} Revenue` : "Revenue Details"}</span>
                </DialogTitle>
                <DialogContent dividers className="rd-revenue-dialog-content">
                    {selectedPeriod && (
                        <>
                            <p className="rd-revenue-period">{selectedPeriod.detail}</p>
                            <div className="rd-schedule-modal-row"><span>Revenue</span><strong>{formatCurrency(selectedPeriod.value)}</strong></div>
                            <div className="rd-schedule-modal-row"><span>Included bookings</span><strong>{selectedBookingCount}</strong></div>
                        </>
                    )}
                </DialogContent>
                <DialogActions className="rd-revenue-dialog-actions">
                    <Button onClick={() => setSelectedPeriod(null)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

function ArrivalChart({ bookings, currentMonth }) {
    const [period, setPeriod] = useState("weekly");
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const data = useMemo(() => {
        const year = currentMonth.getFullYear();
        const monthIndex = currentMonth.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDay = new Date(year, monthIndex, 1);
        const firstMondayOffset = (firstDay.getDay() + 6) % 7;
        const weekCount = Math.ceil((firstMondayOffset + daysInMonth) / 7);

        const weekly = Array.from({ length: weekCount }, (_, index) => {
            const startDay = index * 7 - firstMondayOffset + 1;
            const start = new Date(year, monthIndex, startDay);
            const end = new Date(year, monthIndex, startDay + 6);

            return {
                key: `week-${index + 1}`,
                label: `Week ${index + 1}`,
                detail: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`,
                start: toDateKey(start),
                end: toDateKey(end),
                checkIns: 0,
                checkOuts: 0
            };
        });

        const monthly = Array.from({ length: 12 }, (_, index) => ({
            key: `month-${index + 1}`,
            label: new Date(year, index, 1).toLocaleDateString("en-PH", { month: "short" }),
            detail: new Date(year, index, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
            month: index,
            checkIns: 0,
            checkOuts: 0
        }));

        const activeBookings = bookings.filter((booking) => !["cancelled", "canceled", "noshow"].includes(getStatus(booking).key));

        activeBookings.forEach((booking) => {
            const checkInDate = parseDate(getCheckIn(booking));
            const checkOutDate = parseDate(getCheckOut(booking));

            if (checkInDate && checkInDate.getFullYear() === year) {
                const month = checkInDate.getMonth();
                monthly[month].checkIns += 1;

                if (month === monthIndex) {
                    const weekIndex = Math.floor((checkInDate.getDate() + firstMondayOffset - 1) / 7);
                    if (weekly[weekIndex]) weekly[weekIndex].checkIns += 1;
                }
            }

            if (checkOutDate && checkOutDate.getFullYear() === year) {
                const month = checkOutDate.getMonth();
                monthly[month].checkOuts += 1;

                if (month === monthIndex) {
                    const weekIndex = Math.floor((checkOutDate.getDate() + firstMondayOffset - 1) / 7);
                    if (weekly[weekIndex]) weekly[weekIndex].checkOuts += 1;
                }
            }
        });

        return { weekly, monthly };
    }, [bookings, currentMonth]);

    const rows = data[period];
    const max = Math.max(1, ...rows.flatMap((row) => [row.checkIns, row.checkOuts]));

    return (
        <Paper className="rd-analytics-card rd-arrival-card" elevation={0}>
            <div className="rd-analytics-heading">
                <div>
                    <h2>Daily Schedule</h2>
                    <p>{period === "weekly" ? `Weekly check-ins and check-outs for ${formatMonth(currentMonth)}` : `Monthly check-ins and check-outs for ${currentMonth.getFullYear()}`}</p>
                </div>
                <div className="rd-chart-switch">
                    <button type="button" className={period === "weekly" ? "active" : ""} onClick={() => setPeriod("weekly")}>Weekly</button>
                    <button type="button" className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>Monthly</button>
                </div>
            </div>

            <div className="rd-bar-legend">
                <span><i className="rd-checkin-dot" />Check-in</span>
                <span><i className="rd-checkout-dot" />Check-out</span>
            </div>

            <div className="rd-bar-chart">
                {rows.map((row) => (
                    <button type="button" className="rd-bar-group" key={row.key} title={`View details for ${row.detail}`} onClick={() => setSelectedPeriod(row)}>
                        <div className="rd-bars">
                            {row.checkIns > 0 && <span className="rd-bar rd-bar-checkin" style={{ height: `${(row.checkIns / max) * 100}%` }} title={`Check-in: ${row.checkIns}`} />}
                            {row.checkOuts > 0 && <span className="rd-bar rd-bar-checkout" style={{ height: `${(row.checkOuts / max) * 100}%` }} title={`Check-out: ${row.checkOuts}`} />}
                        </div>
                    </button>
                ))}
            </div>
            <div className={`rd-chart-labels ${period === "monthly" ? "rd-month-labels" : ""}`}>
                {rows.map((row) => (
                    <button type="button" key={row.key} title={row.detail} onClick={() => setSelectedPeriod(row)}>
                        {row.label}
                    </button>
                ))}
            </div>

            <p className="rd-chart-note">{period === "weekly" ? "Select a week to view its check-in and check-out totals." : "Select a month to view its check-in and check-out totals."} Cancelled and no-show bookings are excluded.</p>

            <Dialog open={Boolean(selectedPeriod)} onClose={() => setSelectedPeriod(null)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {selectedPeriod ? `${selectedPeriod.label} Schedule` : "Schedule Details"}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPeriod && (
                        <>
                            <p>{selectedPeriod.detail}</p>
                            <div className="rd-schedule-modal-row"><span>Check-ins</span><strong>{selectedPeriod.checkIns}</strong></div>
                            <div className="rd-schedule-modal-row"><span>Check-outs</span><strong>{selectedPeriod.checkOuts}</strong></div>
                            <div className="rd-schedule-modal-row"><span>Total activities</span><strong>{selectedPeriod.checkIns + selectedPeriod.checkOuts}</strong></div>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedPeriod(null)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

function ReceptionistDashboard() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

    const fetchBookings = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                    return;
                }

                const response = await axios.get(`${API_URL}/bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const records = getRecords(response.data);

                if (!records) {
                    throw new Error("The backend response does not contain a valid booking list.");
                }

                setBookings(records);
            } catch (err) {
                console.error("Failed to fetch bookings:", err);

                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                    return;
                }

                setError(err.response?.data?.message || err.message || "Unable to load bookings. Check your backend connection and API route.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [navigate]
    );

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const offset = new Date(year, month, 1).getDay();
        const count = new Date(year, month + 1, 0).getDate();
        const total = Math.ceil((offset + count) / 7) * 7;

        return Array.from({ length: total }, (_, index) => {
            const date = new Date(year, month, index - offset + 1);

            return { date, key: toDateKey(date), inCurrentMonth: date.getMonth() === month };
        });
    }, [currentMonth]);

    const bookingsByDate = useMemo(() => {
        const grouped = {};

        bookings.forEach((booking) => {
            const key = toDateKey(getCheckIn(booking));

            if (key) {
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(booking);
            }
        });

        Object.values(grouped).forEach((list) => {
            list.sort((a, b) => String(getTime(a)).localeCompare(String(getTime(b))));
        });

        return grouped;
    }, [bookings]);

    const monthBookings = useMemo(() => {
        const prefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

        return bookings.filter((booking) => toDateKey(getCheckIn(booking)).startsWith(prefix));
    }, [bookings, currentMonth]);

    const dailyBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        return (bookingsByDate[selectedDate] || []).filter((booking) => {
            const status = getStatus(booking);
            const matchesStatus = !statusFilter || status.key === normalizeStatus(statusFilter);

            const searchableValues = [
                getGuestName(booking),
                getEmail(booking),
                getPhone(booking),
                getRoom(booking),
                getId(booking)
            ];

            const matchesSearch = !query || searchableValues.some((value) =>
                String(value).toLowerCase().includes(query)
            );

            return matchesStatus && matchesSearch;
        });
    }, [bookingsByDate, selectedDate, search, statusFilter]);

    const paginationTable = useReactTable({
        data: dailyBookings,
        columns: [],
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false
    });

    useEffect(() => {
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }, [selectedDate, search, statusFilter]);

    const stats = useMemo(() => {
        const count = (key) => monthBookings.filter((booking) => getStatus(booking).key === key).length;

        return {
            total: monthBookings.length,
            confirmed: count("confirmed"),
            pending: count("pending"),
            checkedIn: count("checkedin"),
            checkedOut: count("checkedout")
        };
    }, [monthBookings]);

    const changeMonth = (amount) => {
        setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + amount, 1));
    };

    const goToToday = () => {
        const today = new Date();

        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(toDateKey(today));
        setSearch("");
        setStatusFilter("");
    };

    const selectCalendarDay = (day) => {
        setSelectedDate(day.key);

        if (!day.inCurrentMonth) {
            setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
        }

        setSearch("");
        setStatusFilter("");
    };

    const closeBookingDetails = () => setSelectedBooking(null);
    const selectedDateBookings = bookingsByDate[selectedDate] || [];

    return (
        <div className="rd-layout">
            <Sidebar />

            <main className="receptionist-dashboard">
                <header className="rd-page-header">
                    <div className="rd-heading">
                        <h1>Hotel Dashboard</h1>
                        <p>Manage guest reservations and monitor your hotel's booking schedule.</p>
                    </div>

                    <div className="rd-header-actions">
                        <Button className="rd-refresh-button" variant="contained" onClick={() => fetchBookings(true)} disabled={loading || refreshing} startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}>
                            Refresh
                        </Button>
                    </div>
                </header>

                {error && (
                    <Alert className="rd-alert" severity="error" onClose={() => setError("")}
                        action={
                            <Button color="inherit" size="small" onClick={() => fetchBookings(true)}>
                                Retry
                            </Button>
                        }>
                        {error}
                    </Alert>
                )}

                <section className="rd-stats-grid" aria-label="Monthly booking summary">
                    <Paper className="rd-stat-card" elevation={0}>
                        <div className="rd-stat-icon rd-stat-blue"><CalendarMonthRoundedIcon /></div>
                        <div className="rd-stat-content">
                            <span>Monthly Bookings</span>
                            <strong>{loading ? "..." : stats.total}</strong>
                            <small>{formatMonth(currentMonth)}</small>
                        </div>
                    </Paper>

                    <Paper className="rd-stat-card" elevation={0}>
                        <div className="rd-stat-icon rd-stat-green"><EventAvailableRoundedIcon /></div>
                        <div className="rd-stat-content">
                            <span>Check In</span>
                            <strong>{loading ? "..." : stats.checkedIn}</strong>
                            <small>Guests currently checked in</small>
                        </div>
                    </Paper>

                    <Paper className="rd-stat-card" elevation={0}>
                        <div className="rd-stat-icon rd-stat-orange"><ScheduleRoundedIcon /></div>
                        <div className="rd-stat-content">
                            <span>Check Out</span>
                            <strong>{loading ? "..." : stats.checkedOut}</strong>
                            <small>Guests checked out this month</small>
                        </div>
                    </Paper>

                    <Paper className="rd-stat-card rd-revenue-stat" elevation={0}>
                        <div className="rd-stat-icon rd-stat-purple"><PaymentsRoundedIcon /></div>
                        <div className="rd-stat-content">
                            <span>Total Revenue</span>
                            <strong>{loading ? "..." : formatCurrency(bookings.filter(isRevenueBooking).reduce((sum, booking) => sum + getAmount(booking), 0))}</strong>
                            <small>Revenue from non-cancelled bookings</small>
                        </div>
                    </Paper>
                </section>

                <section className="rd-main-grid">
                    <Paper className="rd-calendar-card" elevation={0}>
                        <div className="rd-calendar-toolbar">
                            <div className="rd-calendar-title">
                                <span className="rd-calendar-title-icon"><CalendarMonthRoundedIcon /></span>
                                <div>
                                    <h2>{formatMonth(currentMonth)}</h2>
                                    <p>Choose a date to view reservations</p>
                                </div>
                            </div>

                            <div className="rd-calendar-navigation">
                                <Tooltip title="Previous month">
                                    <IconButton onClick={() => changeMonth(-1)} aria-label="Previous month">
                                        <ChevronLeftRoundedIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Next month">
                                    <IconButton onClick={() => changeMonth(1)} aria-label="Next month">
                                        <ChevronRightRoundedIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="rd-weekdays">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day}>{day}</div>
                            ))}
                        </div>

                        <div className="rd-calendar-grid">
                            {calendarDays.map((day) => {
                                const dayBookings = bookingsByDate[day.key] || [];
                                const isToday = day.key === toDateKey(new Date());
                                const isSelected = day.key === selectedDate;

                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        className={`rd-calendar-day ${!day.inCurrentMonth ? "rd-day-outside" : ""} ${isToday ? "rd-day-today" : ""} ${isSelected ? "rd-day-selected" : ""}`}
                                        onClick={() => selectCalendarDay(day)}
                                        aria-label={`${formatDate(day.key)}, ${dayBookings.length} bookings`}
                                        aria-pressed={isSelected}>
                                        <span className="rd-day-number">{day.date.getDate()}</span>
                                        {dayBookings.length > 0 && (
                                            <span className="rd-day-booking-count">
                                                {dayBookings.length} {dayBookings.length === 1 ? "booking" : "bookings"}
                                            </span>
                                        )}

                                        <span className="rd-day-dots">
                                            {dayBookings.slice(0, 4).map((booking, index) => (
                                                <span key={getId(booking) || index} style={{ background: getStatus(booking).dot }}/>
                                            ))}
                                            {dayBookings.length > 4 && <span className="rd-more-dots">+</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rd-calendar-legend">
                            {["Confirmed", "Pending", "Checked In", "Cancelled"].map((status) => (
                                <span key={status}>
                                    <i style={{ background: (STATUS_STYLES[normalizeStatus(status)] || STATUS_STYLES.pending).dot }} />
                                    {status}
                                </span>
                            ))}
                        </div>
                    </Paper>

                    <Paper className="rd-bookings-card" elevation={0}>
                        <div className="rd-bookings-header">
                            <div>
                                <h2>{formatDate(selectedDate)}</h2>
                                <p>{dailyBookings.length} matching reservations</p>
                            </div>
                            <span className="rd-bookings-header-icon">
                                <EventAvailableRoundedIcon />
                            </span>
                        </div>

                        <div className="rd-booking-filters">
                            <SearchBar value={search} onChange={setSearch} placeholder="Search guest, email, room..."/>
                            <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} label="All Statuses" />
                        </div>

                        {loading ? (
                            <div className="rd-loading">
                                <CircularProgress />
                                <p>Loading reservations from the database...</p>
                            </div>
                        ) : dailyBookings.length === 0 ? (
                            <div className="rd-empty-state">
                                <span><CalendarMonthRoundedIcon /></span>
                                <h3>No bookings found</h3>
                                <p>
                                    {search || statusFilter ? "Try changing your search or status filter." : "There are no reservations for this date."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rd-booking-list">
                                    {paginationTable.getRowModel().rows.map((row) => {
                                        const booking = row.original;

                                        return (
                                            <article className="rd-booking-item" key={getId(booking) || row.id}>
                                                <div className="rd-booking-time">
                                                    <ScheduleRoundedIcon />
                                                    <span>{formatTime(getTime(booking))}</span>
                                                </div>

                                                <div className="rd-booking-main">
                                                    <div className="rd-booking-guest">
                                                        <Avatar className="rd-guest-avatar">
                                                            {getInitials(getGuestName(booking))}
                                                        </Avatar>

                                                        <div className="rd-booking-guest-info">
                                                            <strong>{getGuestName(booking)}</strong>
                                                            <span>{getRoom(booking)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="rd-booking-meta">
                                                        <ReceptionStatus status={getStatus(booking).label}/>
                                                        <span className="rd-booking-amount">
                                                            {formatCurrency(getAmount(booking))}
                                                        </span>
                                                    </div>

                                                    <Button className="rd-view-booking" size="small" onClick={() => setSelectedBooking(booking)} startIcon={<VisibilityRoundedIcon />}>
                                                        View
                                                    </Button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <Pagination table={paginationTable} totalItems={dailyBookings.length}/>
                            </>
                        )}
                    </Paper>
                </section>

                <Dialog open={Boolean(selectedBooking)} onClose={closeBookingDetails} fullWidth maxWidth="md" PaperProps={{ className: "rd-details-dialog" }}>
                    {selectedBooking && (
                        <>
                            <DialogTitle className="rd-details-title">
                                <div>
                                    <h2>Booking Information</h2>
                                    <p>Complete reservation details</p>
                                </div>
                                <IconButton onClick={closeBookingDetails} aria-label="Close details"><CloseRoundedIcon /></IconButton>
                            </DialogTitle>

                            <DialogContent className="rd-details-content">
                                <div className="rd-details-guest">
                                    <Avatar className="rd-details-avatar">{getInitials(getGuestName(selectedBooking))}</Avatar>
                                    <div>
                                        <h3>{getGuestName(selectedBooking)}</h3>
                                        <StatusBadge status={getStatus(selectedBooking).label} />
                                    </div>
                                </div>

                                <div className="rd-details-grid">
                                    <div><span>Booking ID</span><strong>{getBookingDisplayId(selectedBooking)}</strong></div>
                                    <div><span>Guest Name</span><strong>{getGuestName(selectedBooking)}</strong></div>
                                    <div><span>Email Address</span><strong>{getEmail(selectedBooking)}</strong></div>
                                    <div><span>Phone Number</span><strong>{getPhone(selectedBooking)}</strong></div>
                                    <div><span>Room</span><strong>{getRoom(selectedBooking)}</strong></div>
                                    <div><span>Booking Status</span><strong>{getStatus(selectedBooking).label}</strong></div>
                                    <div><span>Check-in Date</span><strong>{formatDate(getCheckIn(selectedBooking))}</strong></div>
                                    <div><span>Check-in Time</span><strong>{formatTime(getTime(selectedBooking), "checkin")}</strong></div>
                                    <div><span>Check-out Date</span><strong>{formatDate(getCheckOut(selectedBooking))}</strong></div>
                                    <div><span>Check-out Time</span><strong>{formatTime(selectedBooking.checkOutTime, "checkout")}</strong></div>
                                    <div><span>Total Amount</span><strong>{formatCurrency(getAmount(selectedBooking))}</strong></div>
                                </div>

                                {selectedBooking.specialRequests && (
                                    <div className="rd-special-requests">
                                        <span>Special Requests</span>
                                        <p>{selectedBooking.specialRequests}</p>
                                    </div>
                                )}

                                <div className="rd-details-extra">
                                    <h3>Other Booking Information</h3>
                                    {Object.entries(selectedBooking).map(([key, value]) => {
                                        const hiddenFields = ["_id", "__v", "password", "token", "specialRequests", "guestName", "fullName", "name", "customerName", "email", "guestEmail", "emailAddress", "phone", "phoneNumber", "guestPhone", "room", "roomId", "roomNumber", "roomName", "roomType", "status", "bookingStatus", "reservationStatus", "checkInDate", "checkIn", "arrivalDate", "bookingDate", "date", "startDate", "checkOutDate", "checkOut", "departureDate", "endDate", "checkInTime", "arrivalTime", "time", "checkOutTime", "totalAmount", "totalPrice", "amount", "price", "bookingCode", "bookingNumber", "bookingId", "reservationId"];
                                        if (hiddenFields.includes(key)) return null;
                                        const formatLabel = (text) => text.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (char) => char.toUpperCase());
                                        const formatValue = (item) => {
                                            if (item === null || item === undefined || item === "") return "Not provided";
                                            if (typeof item === "object") return JSON.stringify(item, null, 2);
                                            if (typeof item === "boolean") return item ? "Yes" : "No";
                                            return String(item);
                                        };
                                        return (
                                            <div className="rd-details-extra-row" key={key}>
                                                <span>{formatLabel(key)}</span>
                                                <strong>{formatValue(value)}</strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            </DialogContent>

                            <DialogActions className="rd-details-actions">
                                <Button onClick={closeBookingDetails} variant="outlined">Close</Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                <section className="rd-analytics-grid">
                    <RevenueChart bookings={bookings} currentMonth={currentMonth} />
                    <ArrivalChart bookings={bookings} currentMonth={currentMonth} />
                </section>
            </main>
        </div>
    );
}

export default ReceptionistDashboard;