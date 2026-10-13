import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Avatar, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Tooltip } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import Sidebar from "../components/Sidebar";
import "../styles/ReceptionistDashboard.css";
import "../styles/BillingPayment.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const STATUS_OPTIONS = [
    { value: "Pending", label: "Pending" }, 
    { value: "Confirmed", label: "Confirmed" }, 
    { value: "Checked In", label: "Checked In" }, 
    { value: "Checked Out", label: "Checked Out" }, 
    { value: "Cancelled", label: "Cancelled" }, 
    { value: "No Show", label: "No Show" }];

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(String(value))
            ? `${value}T12:00:00`
            : value
    );

    if (Number.isNaN(date.getTime())) {
        return "Not provided";
    }

    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

const getRecords = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.bookings)) return payload.bookings;
    if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;

    return [];
};

const getId = (booking) => booking?._id || booking?.id || booking?.bookingId || "";
const getGuest = (booking) => booking?.guestName || booking?.fullName || booking?.name || booking?.guest?.name || "Guest";
const getEmail = (booking) => booking?.guestEmail || booking?.email || booking?.guest?.email || "Not provided";
const getReference = (booking) => { const ref = booking?.bookingCode || booking?.reservationCode || booking?.bookingReference || booking?.reservationReference || booking?.reference || booking?.bookingId; if (ref && /^TM-/i.test(String(ref))) return String(ref).toUpperCase(); const id = String(ref || getId(booking) || "").replace(/[^a-z0-9]/gi, "").toUpperCase(); return `TM-${(id.slice(-6) || "000001").padStart(6, "0")}`; };
const getRoom = (booking) => { const room = booking?.room || booking?.roomId || booking?.roomNumber || booking?.roomName || booking?.roomType; return room && typeof room === "object" ? room.roomNumber || room.number || room.name || room.roomType || room.type || "Room assigned" : room ? String(room) : "Not assigned"; };
const getCheckIn = (booking) => booking?.checkInDate || booking?.checkIn || booking?.arrivalDate || "";
const getCheckOut = (booking) => booking?.checkOutDate || booking?.checkOut || booking?.departureDate || "";

const getPaymentMethod = (booking) => {
    return String(
        booking?.paymentMethod ||
        booking?.paymentType ||
        booking?.paymentOption ||
        booking?.payment?.method ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
};

const isCheckInDateReached = (booking) => {
    const value = getCheckIn(booking);

    if (!value) return false;

    const checkIn = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(String(value))
            ? `${value}T00:00:00`
            : value
    );

    if (Number.isNaN(checkIn.getTime())) {
        return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);

    return today >= checkIn;
};

const getTotal = (booking) => {
    const value =
        booking?.totalAmount ??
        booking?.totalPrice ??
        booking?.total ??
        booking?.amount ??
        booking?.price;

    return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const getPaid = (booking) => {
    return Math.max(
        0,
        Number(booking?.amountPaid ?? booking?.paidAmount ?? 0) || 0
    );
};

const getBookingStatus = (booking) => {
    const value =
        booking?.bookingStatus ||
        booking?.status ||
        booking?.reservationStatus ||
        "Pending";

    const key = String(value)
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    const labels = {
        checkedin: "Checked In",
        checkedout: "Checked Out",
        noshow: "No Show",
        cancelled: "Cancelled",
        canceled: "Cancelled",
        pending: "Pending",
        confirmed: "Confirmed"
    };

    return labels[key] || String(value);
};

const getPaymentStatus = (booking) => {
    const raw = String(booking?.paymentStatus || "Unpaid");

    const key = raw
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    if (key === "paid" || key === "completed") {
        return "Paid";
    }

    if (key.includes("partial")) {
        return "Partially Paid";
    }

    if (key === "pending") {
        return "Pending";
    }

    return "Unpaid";
};

export default function BillingPayments() {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingId, setSavingId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [receiptBooking, setReceiptBooking] = useState(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10
    });

    const [sorting, setSorting] = useState([
        { id: "guest", desc: false }
    ]);

    const fetchBookings = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Your session is missing. Please log in again."
                );
            }

            const response = await axios.get(
                `${API_URL}/bookings`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookings(getRecords(response.data));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load billing records."
            );

            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        setPagination((current) => ({
            ...current,
            pageIndex: 0
        }));
    }, [search, statusFilter]);

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        return bookings.filter((booking) => {
            const statusMatch =
                !statusFilter ||
                getBookingStatus(booking) === statusFilter;

            const searchable = [
                getReference(booking),
                getGuest(booking),
                getEmail(booking),
                getRoom(booking),
                getBookingStatus(booking),
                getPaymentStatus(booking)
            ];

            return (
                statusMatch &&
                (
                    !query ||
                    searchable.some((value) =>
                        String(value).toLowerCase().includes(query)
                    )
                )
            );
        });
    }, [bookings, search, statusFilter]);

    const stats = useMemo(() => {
        return bookings.reduce(
            (summary, booking) => {
                const total = getTotal(booking);
                const paid = getPaid(booking);
                const payment = getPaymentStatus(booking);

                summary.revenue += payment === "Paid" ? total : paid;

                summary.unpaid +=
                    payment === "Paid"
                        ? 0
                        : Math.max(0, total - paid);

                summary.checkedIn +=
                    getBookingStatus(booking) === "Checked In" ? 1 : 0;

                summary.checkedOut +=
                    getBookingStatus(booking) === "Checked Out" ? 1 : 0;

                return summary;
            },
            {
                revenue: 0,
                unpaid: 0,
                checkedIn: 0,
                checkedOut: 0
            }
        );
    }, [bookings]);

    const updateBooking = useCallback(async (booking, updates) => {
        const id = getId(booking);

        if (!id) {
            setError("This booking has no valid ID.");
            return;
        }

        setSavingId(String(id));
        setError("");
        setNotice("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Your session is missing. Please log in again."
                );
            }

            const response = await axios.put(
                `${API_URL}/bookings/${id}`,
                updates,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const updated =
                response.data?.booking ||
                response.data?.data ||
                { ...booking, ...updates };

            setBookings((current) =>
                current.map((item) =>
                    String(getId(item)) === String(id)
                        ? { ...item, ...updated }
                        : item
                )
            );

            setReceiptBooking((current) =>
                current && String(getId(current)) === String(id)
                    ? { ...current, ...updated }
                    : current
            );

            setNotice("Booking updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update booking. Check the backend booking update route."
            );
        } finally {
            setSavingId("");
        }
    }, []);
    
    const columns = useMemo(() => [
        {
            id: "bookingId",
            header: "Booking ID",
            accessorFn: (row) => getReference(row),
            cell: ({ row }) => (
                <strong className="bp-booking-id">
                    {getReference(row.original)}
                </strong>
            )
        },
        {
            id: "guest",
            header: "Guest",
            accessorFn: (row) => getGuest(row),
            cell: ({ row }) => (
                <div className="bp-guest-cell">
                    <Avatar className="bp-guest-avatar">
                        {getGuest(row.original).charAt(0).toUpperCase()}
                    </Avatar>

                    <div className="bp-guest-info">
                        <strong>{getGuest(row.original)}</strong>
                        <span>{getEmail(row.original)}</span>
                    </div>
                </div>
            )
        },
        {
            id: "room",
            header: "Room",
            accessorFn: (row) => getRoom(row),
            cell: ({ getValue }) => (
                <span className="bp-room-value">
                    {getValue()}
                </span>
            )
        },
        {
            id: "checkIn",
            header: "Check-in",
            accessorFn: (row) => getCheckIn(row),
            cell: ({ getValue }) => formatDate(getValue())
        },
        {
            id: "checkOut",
            header: "Check-out",
            accessorFn: (row) => getCheckOut(row),
            cell: ({ getValue }) => formatDate(getValue())
        },
        {
            id: "total",
            header: "Total Amount",
            accessorFn: (row) => getTotal(row),
            cell: ({ getValue }) => (
                <strong className="bp-amount">
                    {currency.format(getValue())}
                </strong>
            )
        },
        {
            id: "payment",
            header: "Payment",
            accessorFn: (row) => getPaymentStatus(row),
            cell: ({ row }) => (
                <Chip
                    size="small"
                    label={getPaymentStatus(row.original)}
                    className={`bp-payment-chip bp-${getPaymentStatus(row.original)
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                />
            )
        },
        {
            id: "status",
            header: "Status",
            accessorFn: (row) => getBookingStatus(row),
            cell: ({ row }) => (
                <Chip
                    size="small"
                    label={getBookingStatus(row.original)}
                    className={`bp-status-chip bp-status-${getBookingStatus(row.original)
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                />
            )
        },
        {
            id: "action",
            header: "Action",
            enableSorting: false,
            cell: ({ row }) => {
                const booking = row.original;
                const id = String(getId(booking));
                const paymentStatus = getPaymentStatus(booking);
                const busy = savingId === id;

                const payAtCheckIn =
                    getPaymentMethod(booking) === "payatcheckin";

                const paymentLockedUntilCheckIn =
                    payAtCheckIn && !isCheckInDateReached(booking);

                const markPaidDisabled =
                    busy ||
                    paymentStatus === "Paid" ||
                    paymentLockedUntilCheckIn;

                let markPaidTooltip = "Mark paid";

                if (paymentStatus === "Paid") {
                    markPaidTooltip = "Already paid";
                } else if (paymentLockedUntilCheckIn) {
                    markPaidTooltip =
                        "Available on or after the guest's check-in date";
                }

                return (
                    <div className="bp-row-actions">
                        <Tooltip title={markPaidTooltip}>
                            <span>
                                <IconButton
                                    size="small"
                                    className="bp-action-button bp-pay-action"
                                    disabled={markPaidDisabled}
                                    onClick={() =>
                                        updateBooking(booking, {
                                            paymentStatus: "Paid",
                                            amountPaid: getTotal(booking)
                                        })
                                    }
                                    aria-label="Mark payment as paid"
                                >
                                    <PaymentsRoundedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Tooltip title="View receipt">
                            <IconButton
                                size="small"
                                className="bp-action-button"
                                onClick={() => setReceiptBooking(booking)}
                                aria-label="View receipt"
                            >
                                <ReceiptLongRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {busy && <CircularProgress size={15} />}
                    </div>
                );
            }
        }
    ], [savingId, updateBooking]);
    
    const table = useReactTable({
        data: filteredBookings,
        columns,
        state: {
            sorting,
            pagination
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false
    });
     
    return (
        <div className="rd-layout">
            <Sidebar />
            <main className="receptionist-dashboard bp-page">
                <header className="bp-page-header">
                    <div>
                        <h1>Billing &amp; Payment</h1>
                        <p>Monitor payment status, and billing details.</p>
                    </div>
                </header>
                
                {notice && <Alert severity="success" onClose={() => setNotice("")} className="bp-alert">{notice}</Alert>}
                {error && <Alert severity="error" onClose={() => setError("")} className="bp-alert" action={<Button color="inherit" size="small" onClick={() => fetchBookings(true)}>Retry</Button>}>{error}</Alert>}
                
                <section className="bp-stats-grid"><Paper component="div" className="bp-stat-card" elevation={0}><span className="bp-stat-icon bp-stat-green"><PaymentsRoundedIcon /></span><div className="bp-stat-copy"><span>Paid Revenue</span><strong>{currency.format(stats.revenue)}</strong><small>Payments received</small></div><span className="bp-stat-decoration" /></Paper><Paper component="div" className="bp-stat-card" elevation={0}><span className="bp-stat-icon bp-stat-orange"><ReceiptLongRoundedIcon /></span><div className="bp-stat-copy"><span>Unpaid Balance</span><strong>{currency.format(stats.unpaid)}</strong><small>Remaining balances</small></div><span className="bp-stat-decoration" /></Paper><Paper component="div" className="bp-stat-card" elevation={0}><span className="bp-stat-icon bp-stat-blue"><LoginRoundedIcon /></span><div className="bp-stat-copy"><span>Checked In</span><strong>{stats.checkedIn}</strong><small>Guests currently checked in</small></div><span className="bp-stat-decoration" /></Paper><Paper component="div" className="bp-stat-card" elevation={0}><span className="bp-stat-icon bp-stat-purple"><LogoutRoundedIcon /></span><div className="bp-stat-copy"><span>Checked Out</span><strong>{stats.checkedOut}</strong><small>Guests checked out</small></div><span className="bp-stat-decoration" /></Paper></section>
                
                <Paper className="bp-table-card" elevation={0}>
                    <div className="bp-table-heading">
                        <span className="bp-record-count">{filteredBookings.length} records</span>
                    </div>

                    <div className="bp-toolbar">
                        <div className="bp-search-wrap">
                            <SearchBar value={search} onChange={setSearch} placeholder="Search booking ID, guest, email, room..." />
                        </div>
                        
                        <div className="bp-toolbar-actions">
                            <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} label="Status" />
                            <Tooltip title="Refresh billing records"><span><IconButton onClick={() => fetchBookings(true)} disabled={loading || refreshing} aria-label="Refresh billing records" className="bp-refresh-button">{refreshing ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}</IconButton></span></Tooltip>
                        </div>
                    </div>

                    <div className="bp-table-wrapper">
                        <table className="bp-table">
                            <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} aria-sort={header.column.getCanSort() ? (header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : "none") : undefined}><button type="button" className={`bp-sort-button ${header.column.getCanSort() ? "is-sortable" : ""}`} onClick={header.column.getToggleSortingHandler()} disabled={!header.column.getCanSort()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() && <span>{header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : "↕"}</span>}</button></th>)}</tr>)}</thead><tbody>{loading ? <tr><td colSpan={columns.length} className="bp-message-cell"><CircularProgress size={28} /><span>Loading billing records...</span></td></tr> : table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="bp-message-cell"><div className="bp-empty-state"><ReceiptLongRoundedIcon /><strong>No billing records found</strong><span>Try changing your search or status filter.</span></div></td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
                    
                    <div className="bp-table-footer">
                        <span>Showing <strong>{table.getRowModel().rows.length ? pagination.pageIndex * pagination.pageSize + 1 : 0}-{Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredBookings.length)}</strong> of <strong>{filteredBookings.length}</strong> billing records</span>
                        
                        <div className="bp-pagination">
                            <IconButton size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><KeyboardArrowLeftRoundedIcon /></IconButton>
                            <span className="bp-page-number">Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}</span>
                            <IconButton size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><KeyboardArrowRightRoundedIcon /></IconButton>
                        </div>
                    </div>
                </Paper>
                
                <Dialog open={Boolean(receiptBooking)} onClose={() => setReceiptBooking(null)} fullWidth maxWidth="sm" className="bp-receipt-dialog">
                    <DialogTitle className="bp-dialog-title">
                        <div>
                            <span>BILLING RECEIPT</span>
                            <h2>{receiptBooking ? getGuest(receiptBooking) : "Receipt"}</h2>
                        </div>
                        
                        <IconButton onClick={() => setReceiptBooking(null)} aria-label="Close receipt"><CloseRoundedIcon /></IconButton>
                        
                    </DialogTitle>
                    
                    <DialogContent dividers>{receiptBooking && 
                        <div className="bp-detail-list">
                            <div className="bp-detail-id">
                                <span>Booking ID</span>
                                <strong>{getReference(receiptBooking)}</strong>
                            </div>
                            <div>
                                <span>Guest Name</span>
                                <strong>{getGuest(receiptBooking)}</strong>
                            </div>
                            
                            <div>
                                <span>Email Address</span>
                                <strong>{getEmail(receiptBooking)}</strong>
                            </div>
                            
                            <div>
                                <span>Room</span>
                                <strong>{getRoom(receiptBooking)}</strong>
                            </div>
                            
                            <div>
                                <span>Check-in</span>
                                <strong>{formatDate(getCheckIn(receiptBooking))}</strong>
                            </div>
                            
                            <div>
                                <span>Check-out</span>
                                <strong>{formatDate(getCheckOut(receiptBooking))}</strong>
                            </div>
                            
                            <div>
                                <span>Payment Status</span>
                                <strong>{getPaymentStatus(receiptBooking)}</strong>
                            </div>
                            
                            <div>
                                <span>Booking Status</span>
                                <strong>{getBookingStatus(receiptBooking)}</strong>
                            </div>
                            
                            <div className="bp-detail-total">
                                <span>Total Amount</span>
                                <strong>{currency.format(getTotal(receiptBooking))}</strong>
                            </div>
                            
                            <div>
                                <span>Amount Paid</span>
                                <strong>{currency.format(getPaid(receiptBooking))}</strong>
                            </div>
                            
                            <div>
                                <span>Remaining Balance</span>
                                <strong>{currency.format(Math.max(0, getTotal(receiptBooking) - getPaid(receiptBooking)))}</strong>
                            </div>
                        </div>}
                    </DialogContent>
                    
                    <DialogActions className="bp-dialog-actions">
                        <Button variant="outlined" onClick={() => setReceiptBooking(null)}>Close</Button>
                        <Button variant="contained" onClick={() => window.print()}>Print Receipt</Button>
                    </DialogActions>
                </Dialog>
            </main>
        </div>
    );
}