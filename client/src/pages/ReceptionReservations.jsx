import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Tooltip } from "@mui/material";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import axios from "axios";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import ReceptionStatus from "../components/ReceptionStatus";
import Pagination from "../components/Pagination";
import "../styles/ReceptionistDashboard.css";
import "../styles/ReceptionReservations.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const STATUS_OPTIONS = [
    { value: "Confirmed", label: "Confirmed" },
    { value: "Checked In", label: "Checked In" },
    { value: "Checked Out", label: "Checked Out" },
    { value: "Pending", label: "Pending" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "No Show", label: "No Show" }
];

const normalizeStatus = (status = "") => String(status).toLowerCase().replace(/[\s_-]/g, "");

const getStatus = (booking) => {
    const raw = booking.status || booking.bookingStatus || booking.reservationStatus || "Pending";
    const key = normalizeStatus(raw);
    const labels = {
        confirmed: "Confirmed",
        checkedin: "Checked In",
        checkedout: "Checked Out",
        cancelled: "Cancelled",
        canceled: "Cancelled",
        pending: "Pending",
        noshow: "No Show"
    };
    return { key, label: labels[key] || String(raw) };
};

const getId = (booking) => booking._id || booking.id || booking.bookingId || booking.reservationId || "";
const getBookingCode = (booking) => {
    const suppliedCode = booking.bookingCode || booking.reservationCode || booking.bookingNumber || booking.reservationNumber;
    if (suppliedCode && /^TM-/i.test(String(suppliedCode))) return String(suppliedCode).toUpperCase();
    if (booking.bookingId && /^TM-/i.test(String(booking.bookingId))) return String(booking.bookingId).toUpperCase();
    const source = String(suppliedCode || getId(booking) || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
    return `TM-${(source.slice(-6) || "000001").padStart(6, "0")}`;
};
const getGuestName = (booking) => booking.guestName || booking.fullName || booking.name || booking.customerName || booking.guest?.name || booking.user?.name || "Guest";
const getReservationType = (booking) => {
    const type = booking.reservationType || booking.bookingType || booking.bookingSource || booking.source || "";
    const normalized = String(type).toLowerCase().trim();
    if (normalized.includes("online") || normalized.includes("website")) return "Online";
    return "Walk-in";
};
const getEmail = (booking) => booking.email || booking.guestEmail || booking.emailAddress || booking.guest?.email || booking.user?.email || "Not provided";
const getPhone = (booking) => booking.phone || booking.phoneNumber || booking.guestPhone || booking.guest?.phone || booking.user?.phone || "Not provided";

const getRoom = (booking) => {
    const room = booking.room || booking.roomId || booking.roomNumber || booking.roomName || booking.roomType;
    if (room && typeof room === "object") return room.roomNumber || room.number || room.name || room.roomType || room.type || "Room assigned";
    return room ? String(room) : "Not assigned";
};

const getCheckIn = (booking) => booking.checkInDate || booking.checkIn || booking.arrivalDate || booking.bookingDate || booking.date || "";
const getCheckOut = (booking) => booking.checkOutDate || booking.checkOut || booking.departureDate || "";
const getAmount = (booking) => {
    const value = booking.totalAmount ?? booking.totalPrice ?? booking.amount ?? booking.price;
    const amount = Number(value);
    return value === null || value === undefined || value === "" || !Number.isFinite(amount) ? 0 : amount;
};
const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? null : date;
};
const formatDate = (value) => {
    const date = parseDate(value);
    return date ? date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Not provided";
};
const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(amount) || 0);
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

export default function ReceptionReservations() {
    const navigate = useNavigate();
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.message || "");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [deletingId, setDeletingId] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState([]);
    const [deleteBooking, setDeleteBooking] = useState(null);

    const fetchBookings = useCallback(async (refresh = false) => {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }
            const response = await axios.get(`${API_URL}/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const records = getRecords(response.data);
            if (!records) throw new Error("The server did not return a valid reservations list.");
            setBookings(records);
        } catch (err) {
            console.error("Failed to load reservations:", err);
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
                return;
            }
            setError(err.response?.data?.message || err.message || "Unable to load reservations.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        if (location.state?.message) {
            setNotice(location.state.message);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleDelete = async () => {
        if (!deleteBooking) return;

        const id = getId(deleteBooking);

        if (!id) {
            setError("Unable to delete reservation. Booking ID is missing.");
            return;
        }

        try {
            setDeletingId(String(id));
            setError("");
            setNotice("");

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Your session is missing. Please log in again.");
            }

            await axios.delete(`${API_URL}/bookings/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setBookings((current) =>
                current.filter((booking) => String(getId(booking)) !== String(id))
            );

            setNotice("Reservation deleted successfully.");
            setDeleteBooking(null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete reservation. Please check the backend DELETE route."
            );
        } finally {
            setDeletingId("");
        }
    };

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();
        return bookings.filter((booking) => {
            const status = getStatus(booking);
            const matchesStatus = !statusFilter || status.key === normalizeStatus(statusFilter);
            const searchable = [getBookingCode(booking), getGuestName(booking), getEmail(booking), getPhone(booking), getRoom(booking), getReservationType(booking), status.label];
            return matchesStatus && (!query || searchable.some((value) => String(value).toLowerCase().includes(query)));
        });
    }, [bookings, search, statusFilter]);

    useEffect(() => {
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }, [search, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: bookings.length,
            pending: bookings.filter((booking) => getStatus(booking).key === "pending").length,
            confirmed: bookings.filter((booking) => getStatus(booking).key === "confirmed").length,
            checkedIn: bookings.filter((booking) => getStatus(booking).key === "checkedin").length,
            checkedOut: bookings.filter((booking) => getStatus(booking).key === "checkedout").length,
            cancelled: bookings.filter((booking) => getStatus(booking).key === "cancelled").length,
            noShow: bookings.filter((booking) => getStatus(booking).key === "noshow").length
        };
    }, [bookings]);

    const columns = useMemo(() => [
        { id: "bookingId", header: "Booking ID", accessorFn: (row) => getBookingCode(row), cell: ({ row }) => <strong className="rr-booking-id">{getBookingCode(row.original)}</strong> },
        {
            id: "guest",
            header: "Guest",
            accessorFn: (row) => getGuestName(row),
            cell: ({ row }) => (
                <div className="rr-guest-cell">
                    <Avatar className="rr-guest-avatar">{getGuestName(row.original).charAt(0).toUpperCase()}</Avatar>
                    <div className="rr-guest-info">
                        <strong>{getGuestName(row.original)}</strong>
                        <span>{getEmail(row.original)}</span>
                    </div>
                </div>
            )
        },
        {
            id: "guestType",
            header: "Guest Type",
            accessorFn: (row) => getReservationType(row),
            cell: ({ row }) => (
                <span className={`rr-guest-type ${getReservationType(row.original) === "Online" ? "rr-guest-type-online" : "rr-guest-type-walkin"}`}>
                    {getReservationType(row.original)}
                </span>
            )
        },
        { id: "room", header: "Room", accessorFn: (row) => getRoom(row), cell: ({ getValue }) => <span className="rr-room-value">{getValue()}</span> },
        { id: "checkIn", header: "Check-in", accessorFn: (row) => getCheckIn(row), cell: ({ getValue }) => formatDate(getValue()) },
        { id: "checkOut", header: "Check-out", accessorFn: (row) => getCheckOut(row), cell: ({ getValue }) => formatDate(getValue()) },
        { id: "amount", header: "Total Amount", accessorFn: (row) => getAmount(row), cell: ({ getValue }) => <strong className="rr-amount">{formatCurrency(getValue())}</strong> },
        {
            id: "status",
            header: "Status",
            accessorFn: (row) => getStatus(row).label,
            cell: ({ row }) => {
                const status = getStatus(row.original);
                return <StatusBadge status={status.label} />;
            }
        },
        {
            id: "actions",
            header: "Action",
            enableSorting: false,
            cell: ({ row }) => (
            <div className="rr-row-actions">
                <Tooltip title="View reservation"><IconButton size="small" className="rr-view-button" onClick={() => setSelectedBooking(row.original)} aria-label={`View reservation for ${getGuestName(row.original)}`}><VisibilityRoundedIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete reservation"><IconButton size="small" className="rr-delete-button" onClick={() => setDeleteBooking(row.original)} aria-label={`Delete reservation for ${getGuestName(row.original)}`}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
            </div>
            )
        }
    ], [navigate, deletingId, selectedBooking]);

    const table = useReactTable({
        data: filteredBookings,
        columns,
        state: {
            globalFilter: search,
            pagination,
            sorting
        },
        onGlobalFilterChange: setSearch,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const booking = row.original;

            const text = [
                getBookingCode(booking),
                getGuestName(booking),
                getEmail(booking),
                getPhone(booking),
                getRoom(booking),
                getReservationType(booking),
                getStatus(booking).label
            ].join(" ").toLowerCase();

            return text.includes(
                String(filterValue || "").toLowerCase()
            );
        },
        autoResetPageIndex: false
    });

    const statCards = [
        { label: "Total Reservations", value: loading ? "..." : stats.total, caption: "View all reservations", icon: <EventAvailableRoundedIcon />, tone: "blue", filter: "All Statuses" },
        { label: "Pending", value: loading ? "..." : stats.pending, caption: "Awaiting confirmation", icon: <ScheduleRoundedIcon />, tone: "orange", filter: "Pending" },
        { label: "Confirmed", value: loading ? "..." : stats.confirmed, caption: "Confirmed reservations", icon: <EventAvailableRoundedIcon />, tone: "green", filter: "Confirmed" },
        { label: "Cancelled", value: loading ? "..." : stats.cancelled, caption: "Cancelled reservations", icon: <CancelRoundedIcon />, tone: "purple", filter: "Cancelled" },
        { label: "No Show", value: loading ? "..." : stats.noShow, caption: "Guests who did not arrive", icon: <PersonOffRoundedIcon />, tone: "burgundy", filter: "No Show" }
    ];

    return (
        <div className="rd-layout">
            <Sidebar />
            <main className="receptionist-dashboard rr-page">
                <header className="rr-page-header">
                    <div>
                        <h1>Guest Reservations</h1>
                        <p>Register guests and manage room assignments, guest stays, and reservation status.</p>
                    </div>
                    <Button variant="contained" startIcon={<AddRoundedIcon />} className="rr-primary-button" onClick={() => navigate("/receptionist/reservations/new")}>New Reservation</Button>
                </header>

                {notice && <Alert severity="success" onClose={() => setNotice("")} className="rr-alert">{notice}</Alert>}
                {error && <Alert severity="error" onClose={() => setError("")} className="rr-alert" action={<Button color="inherit" size="small" onClick={() => fetchBookings(true)}>Retry</Button>}>{error}</Alert>}

                <section className="rr-stats-grid">
                    {statCards.map((stat) => (
                        <Paper key={stat.label} component="div" className="rr-stat-card" elevation={0}>
                            <span className={`rr-stat-icon rr-stat-${stat.tone}`}>{stat.icon}</span>
                            <div className="rr-stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.caption}</small></div>
                            <span className="rr-stat-decoration" />
                        </Paper>
                    ))}
                </section>

                <Paper className="rr-table-card" elevation={0}>
                    <div className="rr-table-heading">
                        <span className="rr-record-count">{filteredBookings.length} records</span>
                    </div>
                    <div className="rr-toolbar">
                        <div className="rr-search-wrap">
                            <SearchBar value={search} onChange={setSearch} placeholder="Search booking ID, guest, email, room..." />
                        </div>
                        <div className="rr-toolbar-actions">
                            <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} label="Status" />
                            <Tooltip title="Refresh reservations">
                                <span>
                                    <IconButton onClick={() => fetchBookings(true)} disabled={loading || refreshing} aria-label="Refresh reservations" className="rr-refresh-button">
                                        {refreshing ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="rr-table-wrapper">
                        <table className="rr-table">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id}>
                                                {header.isPlaceholder ? null : (
                                                    <button
                                                        type="button"
                                                        className={`rr-sort-button ${
                                                            header.column.getCanSort()
                                                                ? "is-sortable"
                                                                : ""
                                                        }`}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        disabled={!header.column.getCanSort()}
                                                        aria-label={`Sort by ${
                                                            typeof header.column.columnDef.header === "string"
                                                                ? header.column.columnDef.header
                                                                : header.id
                                                        }`}>
                                                        <span>
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                        </span>

                                                        {header.column.getCanSort() && (
                                                            <span className="rr-sort-icon" aria-hidden="true">
                                                                {header.column.getIsSorted() === "asc" ? (
                                                                    <ArrowUpwardRoundedIcon fontSize="inherit" />
                                                                ) : header.column.getIsSorted() === "desc" ? (
                                                                    <ArrowDownwardRoundedIcon fontSize="inherit" />
                                                                ) : (
                                                                    <UnfoldMoreRoundedIcon fontSize="inherit" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="rr-message-cell">
                                            <CircularProgress size={28} />
                                            <span>Loading reservations...</span>
                                        </td>
                                    </tr>
                                ) : error && bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="rr-message-cell">
                                            Unable to display reservations.
                                        </td>
                                    </tr>
                                ) : table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="rr-message-cell">
                                            <div className="rr-empty-state">
                                                <EventAvailableRoundedIcon />
                                                <strong>No reservations found</strong>
                                                <span>Try changing your search or status filter.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="rr-table-footer">
                        <span>Showing <strong>{table.getRowModel().rows.length ? pagination.pageIndex * pagination.pageSize + 1 : 0}-{Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredBookings.length)}</strong> of <strong>{filteredBookings.length}</strong> reservations</span>
                        <div className="rr-pagination">
                            <IconButton size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><KeyboardArrowLeftRoundedIcon /></IconButton>
                            <span className="rr-page-number">Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}</span>
                            <IconButton size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><KeyboardArrowRightRoundedIcon /></IconButton>
                        </div>
                    </div>
                </Paper>

                <Dialog open={Boolean(selectedBooking)} onClose={() => setSelectedBooking(null)} fullWidth maxWidth="sm" className="rr-details-dialog">
                    {selectedBooking && (
                        <>
                            <DialogTitle className="rr-dialog-title">
                                <div><span>RESERVATION DETAILS</span><h2>{getGuestName(selectedBooking)}</h2></div>
                                <IconButton onClick={() => setSelectedBooking(null)} aria-label="Close details"><CloseRoundedIcon /></IconButton>
                            </DialogTitle>
                            <DialogContent dividers>
                                <div className="rr-detail-list">
                                    <div className="rr-detail-id">
                                        <span>Booking ID</span>
                                        <strong>{getBookingCode(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Guest Name</span>
                                        <strong>{getGuestName(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Guest Type</span>
                                        <strong>{getReservationType(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Email Address</span>
                                        <strong>{getEmail(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Phone Number</span>
                                        <strong>{getPhone(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Room</span>
                                        <strong>{getRoom(selectedBooking)}</strong>
                                    </div>

                                    <div>
                                        <span>Check-in</span>
                                        <strong>{formatDate(getCheckIn(selectedBooking))}</strong>
                                    </div>

                                    <div>
                                        <span>Check-out</span>
                                        <strong>{formatDate(getCheckOut(selectedBooking))}</strong>
                                    </div>

                                    <div>
                                        <span>Total Amount</span>
                                        <strong className="rr-detail-amount">{formatCurrency(getAmount(selectedBooking))}</strong>
                                    </div>

                                    <div>
                                        <span>Reservation Status</span>
                                        <strong><ReceptionStatus status={getStatus(selectedBooking).label} /></strong>
                                    </div>
                                </div>
                            </DialogContent>

                            <DialogActions>
                                <Button onClick={() => setSelectedBooking(null)} className="rr-dialog-close">Close</Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                <Dialog open={Boolean(deleteBooking)} onClose={() => !deletingId && setDeleteBooking(null)} maxWidth="xs" fullWidth PaperProps={{ className: "rr-delete-dialog" }}>
                    <DialogContent className="rr-delete-content">
                        <div className="rr-delete-accent" />
                        <h2 className="rr-delete-title">Delete Reservation?</h2>
                        <p className="rr-delete-message">
                            Are you sure you want to delete the reservation for{" "}
                            <strong>{deleteBooking ? getGuestName(deleteBooking) : ""}</strong>?
                        </p>

                        <p className="rr-delete-warning">
                            This action cannot be undone.
                        </p>
                        <div className="rr-delete-actions">
                            <Button  className="rr-cancel-button" onClick={() => setDeleteBooking(null)} disabled={Boolean(deletingId)}>
                                Cancel
                            </Button>
                            <Button className="rr-confirm-button" onClick={handleDelete} disabled={Boolean(deletingId)}>
                                {deletingId ? "Deleting..." : "Delete Reservation"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
