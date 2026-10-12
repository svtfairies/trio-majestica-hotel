
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Avatar, CircularProgress, Chip, IconButton, Tooltip } from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import "../styles/BookingCalendar.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getBookingDate = (booking) => booking?.checkInDate || booking?.checkIn || booking?.arrivalDate || booking?.bookingDate || booking?.date || booking?.startDate || "";

const getBookingStatus = (booking) => String(booking?.status || booking?.bookingStatus || "Pending").trim();

const normalizeStatus = (status) => status.toLowerCase().replace(/[\s_-]+/g, "");

const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    if (["confirmed", "checkedin", "checkedout", "completed"].includes(normalized)) return "confirmed";
    if (["cancelled", "canceled", "noshow", "rejected"].includes(normalized)) return "cancelled";
    if (["pending", "reserved", "reservationpending"].includes(normalized)) return "pending";
    return "default";
};

const getGuestName = (booking) => booking?.guestName || booking?.fullName || booking?.name || booking?.customerName || booking?.user?.name || booking?.guest?.name || "Guest";

const getRoomName = (booking) => {
    const room = booking?.room || booking?.roomId || booking?.roomNumber || booking?.roomName || booking?.roomType;
    if (room && typeof room === "object") return room.roomNumber || room.number || room.name || room.roomType || room.type || "Room assigned";
    return room ? String(room) : "Room not assigned";
};

const getBookingId = (booking) => booking?._id || booking?.id || booking?.bookingId || "";

const getResponseBookings = (response) => {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.bookings)) return data.data.bookings;
    if (Array.isArray(data?.reservations)) return data.reservations;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};

export default function BookingCalendar({ onBookingSelect, refreshKey = 0 }) {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setBookings([]);
                setError("Please log in to view bookings.");
                return;
            }
            const response = await axios.get(`${API_URL}/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(getResponseBookings(response));
        } catch (err) {
            setBookings([]);
            setError(err.response?.data?.message || "Unable to load bookings. Please check your backend booking API.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings, refreshKey]);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(year, month, 1 - firstDay.getDay());
        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);
            return date;
        });
    }, [currentDate]);

    const bookingsByDate = useMemo(() => {
        const grouped = {};
        bookings.forEach((booking) => {
            const rawDate = getBookingDate(booking);
            if (!rawDate) return;
            const parsedDate = new Date(rawDate);
            if (Number.isNaN(parsedDate.getTime())) return;
            const key = formatDateKey(parsedDate);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(booking);
        });
        return grouped;
    }, [bookings]);

    const selectedBookings = useMemo(() => bookingsByDate[selectedDate] || [], [bookingsByDate, selectedDate]);

    const monthBookings = useMemo(() => bookings.filter((booking) => {
        const rawDate = getBookingDate(booking);
        if (!rawDate) return false;
        const date = new Date(rawDate);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth();
    }), [bookings, currentDate]);

    const changeMonth = (offset) => {
        setCurrentDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(formatDateKey(today));
    };

    const formatSelectedDate = () => {
        const date = new Date(`${selectedDate}T12:00:00`);
        return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    };

    return (
        <section className="booking-calendar">
            <div className="booking-calendar-header">
                <div className="booking-calendar-heading">
                    <div className="booking-calendar-heading-icon"><CalendarMonthRoundedIcon /></div>
                    <div>
                        <h2>Booking Calendar</h2>
                        <p>Manage reservations and guest arrivals.</p>
                    </div>
                </div>
                <button type="button" className="booking-calendar-today" onClick={goToToday}><TodayRoundedIcon /> Today</button>
            </div>

            {error && <Alert severity="error" className="booking-calendar-alert" action={<button type="button" className="booking-calendar-retry" onClick={loadBookings}>Retry</button>}>{error}</Alert>}

            <div className="booking-calendar-layout">
                <div className="booking-calendar-month-panel">
                    <div className="booking-calendar-toolbar">
                        <div>
                            <h3>{MONTHS[currentDate.getMonth()]}</h3>
                            <span>{currentDate.getFullYear()}</span>
                        </div>
                        <div className="booking-calendar-month-actions">
                            <Tooltip title="Previous month"><IconButton aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeftRoundedIcon /></IconButton></Tooltip>
                            <Tooltip title="Next month"><IconButton aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRightRoundedIcon /></IconButton></Tooltip>
                        </div>
                    </div>

                    <div className="booking-calendar-weekdays">
                        {WEEKDAYS.map((day) => <div key={day}>{day}</div>)}
                    </div>

                    <div className="booking-calendar-grid">
                        {calendarDays.map((date) => {
                            const dateKey = formatDateKey(date);
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                            const isToday = dateKey === formatDateKey(new Date());
                            const isSelected = dateKey === selectedDate;
                            const dayBookings = bookingsByDate[dateKey] || [];
                            return (
                                <button type="button" key={dateKey} className={`booking-calendar-day${isCurrentMonth ? "" : " outside-month"}${isToday ? " today" : ""}${isSelected ? " selected" : ""}${dayBookings.length ? " has-bookings" : ""}`} onClick={() => setSelectedDate(dateKey)} aria-label={`${date.toDateString()}, ${dayBookings.length} bookings`} aria-pressed={isSelected}>
                                    <span className="booking-calendar-day-number">{date.getDate()}</span>
                                    {dayBookings.length > 0 && <span className="booking-calendar-day-count">{dayBookings.length}</span>}
                                    {dayBookings.length > 0 && <span className="booking-calendar-day-dots"><i /><i /><i /></span>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="booking-calendar-legend">
                        <span><i className="legend-today" /> Today</span>
                        <span><i className="legend-booked" /> Has bookings</span>
                        <span><i className="legend-selected" /> Selected</span>
                    </div>
                </div>

                <aside className="booking-calendar-details">
                    <div className="booking-calendar-details-header">
                        <div className="booking-calendar-details-icon"><EventAvailableRoundedIcon /></div>
                        <div>
                            <span className="booking-calendar-eyebrow">DAILY SCHEDULE</span>
                            <h3>{formatSelectedDate()}</h3>
                            <p>{selectedBookings.length} {selectedBookings.length === 1 ? "reservation" : "reservations"}</p>
                        </div>
                    </div>

                    <div className="booking-calendar-summary">
                        <div><span>Monthly bookings</span><strong>{monthBookings.length}</strong></div>
                        <div><span>Selected day</span><strong>{selectedBookings.length}</strong></div>
                    </div>

                    <div className="booking-calendar-bookings">
                        {loading ? (
                            <div className="booking-calendar-state"><CircularProgress size={30} sx={{ color: "#800020" }} /><p>Loading reservations...</p></div>
                        ) : selectedBookings.length === 0 ? (
                            <div className="booking-calendar-empty"><div className="booking-calendar-empty-icon"><EventAvailableRoundedIcon /></div><h4>No reservations</h4><p>There are no bookings scheduled for this date.</p></div>
                        ) : (
                            selectedBookings.map((booking, index) => {
                                const status = getBookingStatus(booking);
                                const bookingId = getBookingId(booking);
                                return (
                                    <button type="button" className="booking-calendar-booking-card" key={bookingId || `${selectedDate}-${index}`} onClick={() => onBookingSelect?.(booking)}>
                                        <div className="booking-calendar-booking-top">
                                            <Avatar className="booking-calendar-guest-avatar"><PersonRoundedIcon /></Avatar>
                                            <div className="booking-calendar-guest-info"><strong>{getGuestName(booking)}</strong><span>{booking?.bookingReference || booking?.reference || (bookingId ? `Booking #${String(bookingId).slice(-6).toUpperCase()}` : "Reservation")}</span></div>
                                            <Chip size="small" label={status} className={`booking-status-chip ${getStatusClass(status)}`} />
                                        </div>
                                        <div className="booking-calendar-booking-meta">
                                            <span><MeetingRoomRoundedIcon /> {getRoomName(booking)}</span>
                                            <span><AccessTimeRoundedIcon /> {booking?.checkInTime || booking?.arrivalTime || booking?.time || "Check-in time not set"}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>
            </div>
        </section>
    );
}