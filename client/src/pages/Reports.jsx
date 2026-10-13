import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, CircularProgress, IconButton, Tooltip } from "@mui/material";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import "../styles/HotelOperations.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const reportFilters = [
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Checked In", label: "Checked In" },
    { value: "Checked Out", label: "Checked Out" },
    { value: "Pending", label: "Pending" }
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

export default function Reports() {
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const [bookingsResponse, summaryResponse] = await Promise.all([
                axios.get(`${API_URL}/bookings`, { headers }),
                axios.get(`${API_URL}/bookings/summary`, { headers })
            ]);

            setBookings(bookingsResponse.data?.bookings || []);
            setSummary(summaryResponse.data?.summary || null);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load reports.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        return bookings.filter((booking) => {
            const matchesFilter = !filter || booking.bookingStatus === filter || booking.paymentStatus === filter;
            const matchesSearch = !query || [booking.guestName, booking.bookingReference, booking.room?.name, booking.bookingStatus, booking.paymentStatus]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

            return matchesFilter && matchesSearch;
        });
    }, [bookings, filter, search]);

    const totals = useMemo(() => {
        return filteredBookings.reduce((report, booking) => {
            const amount = Number(booking.totalAmount || 0);
            report.totalRevenue += booking.paymentStatus === "Paid" ? amount : 0;
            report.expectedRevenue += amount;
            report.pendingPayments += booking.paymentStatus !== "Paid" ? 1 : 0;
            report.totalNights += Number(booking.totalNights || 0);
            return report;
        }, { totalRevenue: 0, expectedRevenue: 0, pendingPayments: 0, totalNights: 0 });
    }, [filteredBookings]);

    const statusCounts = useMemo(() => {
        return filteredBookings.reduce((counts, booking) => {
            counts[booking.bookingStatus] = (counts[booking.bookingStatus] || 0) + 1;
            return counts;
        }, {});
    }, [filteredBookings]);

    return (
        <section className="operations-page">
            <div className="operations-header">
                <div>
                    <span className="operations-kicker">MANAGEMENT</span>
                    <h2>Reports</h2>
                    <p>Review reservation volume, stay activity, and payment performance.</p>
                </div>
                <Tooltip title="Refresh reports">
                    <IconButton className="operations-icon-button" onClick={loadReports}><RefreshRoundedIcon /></IconButton>
                </Tooltip>
            </div>

            {error && <Alert severity="error" className="mb-3">{error}</Alert>}

            {loading ? (
                <div className="operations-state"><CircularProgress size={30} /><p>Loading reports...</p></div>
            ) : (
                <>
                    <div className="row g-3 operations-stats">
                        <div className="col-12 col-md-3"><div className="operations-stat"><span>Total Bookings</span><strong>{summary?.total ?? filteredBookings.length}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat"><span>Paid Revenue</span><strong>{currency.format(totals.totalRevenue)}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat"><span>Expected Revenue</span><strong>{currency.format(totals.expectedRevenue)}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat"><span>Occupied Nights</span><strong>{totals.totalNights}</strong></div></div>
                    </div>

                    <div className="row g-3 operations-stats">
                        <div className="col-12 col-md-3"><div className="operations-stat secondary"><span>Today Arrivals</span><strong>{summary?.todayArrivals ?? 0}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat secondary"><span>Today Departures</span><strong>{summary?.todayDepartures ?? 0}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat secondary"><span>Pending Bookings</span><strong>{summary?.pending ?? 0}</strong></div></div>
                        <div className="col-12 col-md-3"><div className="operations-stat secondary"><span>Pending Payments</span><strong>{totals.pendingPayments}</strong></div></div>
                    </div>

                    <div className="operations-report-grid">
                        <div className="operations-report-panel">
                            <h3>Status Breakdown</h3>
                            {Object.keys(statusCounts).length === 0 ? (
                                <p>No booking status data available.</p>
                            ) : (
                                Object.entries(statusCounts).map(([statusName, count]) => (
                                    <div className="status-row" key={statusName}>
                                        <StatusBadge status={statusName} />
                                        <strong>{count}</strong>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="operations-report-panel">
                            <h3>Report Filters</h3>
                            <div className="operations-toolbar compact">
                                <SearchBar value={search} onChange={setSearch} placeholder="Search report records" />
                                <FilterDropdown value={filter} onChange={setFilter} options={reportFilters} label="All Records" />
                            </div>
                        </div>
                    </div>

                    <div className="operations-table-wrap">
                        {filteredBookings.length === 0 ? (
                            <div className="operations-state"><AssessmentRoundedIcon /><p>No report records found.</p></div>
                        ) : (
                            <table className="table table-hover align-middle operations-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Guest</th>
                                        <th>Room</th>
                                        <th>Dates</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id}>
                                            <td><strong>{booking.bookingReference}</strong></td>
                                            <td>{booking.guestName}</td>
                                            <td>{booking.room?.name || "Room not assigned"}</td>
                                            <td>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</td>
                                            <td><StatusBadge status={booking.bookingStatus} /></td>
                                            <td>{booking.paymentStatus}</td>
                                            <td><strong>{currency.format(Number(booking.totalAmount || 0))}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
