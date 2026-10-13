import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    Select,
    Tooltip
} from "@mui/material";
import {
    RefreshRounded,
    FileDownloadRounded,
    PaymentsRounded,
    EventAvailableRounded,
    HotelRounded,
    TrendingUpRounded
} from "@mui/icons-material";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import Sidebar from "../components/Sidebar";
import "../styles/ReceptionistDashboard.css";
import "../styles/Reports.css";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const COLORS = ["#7b1735", "#bd9656", "#477c72", "#8794a5", "#d78b56", "#a76b8b"];

const getRecords = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.bookings)) return payload.bookings;
    if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
};

const getCheckIn = (booking) =>
    booking?.checkInDate || booking?.checkIn || booking?.arrivalDate || "";

const getCheckOut = (booking) =>
    booking?.checkOutDate || booking?.checkOut || booking?.departureDate || "";

const getTotal = (booking) => {
    const value =
        booking?.totalAmount ??
        booking?.totalPrice ??
        booking?.total ??
        booking?.amount ??
        booking?.price ??
        0;

    return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const getPaid = (booking) =>
    Math.max(0, Number(booking?.amountPaid ?? booking?.paidAmount ?? 0) || 0);

const getBookingStatus = (booking) =>
    String(
        booking?.bookingStatus ||
        booking?.status ||
        booking?.reservationStatus ||
        "Pending"
    );

const getPaymentStatus = (booking) => {
    const status = String(booking?.paymentStatus || "Unpaid")
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    if (status === "paid" || status === "completed") return "Paid";
    if (status.includes("partial")) return "Partially Paid";
    if (status === "pending") return "Pending";
    return "Unpaid";
};

const getGuestName = (booking) =>
    booking?.guestName ||
    booking?.fullName ||
    booking?.name ||
    booking?.guest?.name ||
    "Guest";

const parseDate = (value) => {
    if (!value) return null;

    const date = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(String(value))
            ? `${value}T12:00:00`
            : value
    );

    return Number.isNaN(date.getTime()) ? null : date;
};

const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
});

const monthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date) =>
    date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });

const formatDate = (value) => {
    const date = parseDate(value);

    return date
        ? date.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric"
          })
        : "Not provided";
};

const escapeCsv = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
};

export default function Reports() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [period, setPeriod] = useState("6");
    const [reportType, setReportType] = useState("all");
    const chartsRef = useRef(null);

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
                throw new Error("Your session is missing. Please log in again.");
            }

            const response = await axios.get(`${API_URL}/bookings`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setBookings(getRecords(response.data));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Unable to load report data."
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

    const filteredBookings = useMemo(() => {
        const now = new Date();
        const months = Number(period);

        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setMonth(start.getMonth() - Math.max(months - 1, 0));

        return bookings.filter((booking) => {
            const date = parseDate(getCheckIn(booking));
            if (!date) return period === "all";
            if (period === "all") return true;
            return date >= start && date <= new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59
            );
        });
    }, [bookings, period]);

    const reportBookings = useMemo(() => {
        if (reportType === "all") return filteredBookings;
        if (reportType === "payments") {
            return filteredBookings.filter((booking) => getPaymentStatus(booking) === "Paid");
        }
        if (reportType === "unpaid") {
            return filteredBookings.filter((booking) => getPaymentStatus(booking) !== "Paid");
        }
        return filteredBookings.filter((booking) =>
            ["Checked In", "Checked Out"].includes(getBookingStatus(booking))
        );
    }, [filteredBookings, reportType]);

    const stats = useMemo(() => {
        const totalRevenue = reportBookings.reduce((sum, booking) => {
            const isPaid = getPaymentStatus(booking) === "Paid";
            return sum + (isPaid ? getTotal(booking) : getPaid(booking));
        }, 0);

        const outstandingBalance = reportBookings.reduce((sum, booking) => {
            return sum + (
                getPaymentStatus(booking) === "Paid"
                    ? 0
                    : Math.max(0, getTotal(booking) - getPaid(booking))
            );
        }, 0);

        const checkedIn = reportBookings.filter(
            (booking) => getBookingStatus(booking).toLowerCase() === "checked in"
        ).length;

        const paidBookings = reportBookings.filter(
            (booking) => getPaymentStatus(booking) === "Paid"
        ).length;

        return {
            totalRevenue,
            outstandingBalance,
            checkedIn,
            paidBookings,
            totalBookings: reportBookings.length
        };
    }, [reportBookings]);

    const monthlyData = useMemo(() => {
        const months = [];
        const count = period === "all" ? 12 : Number(period);
        const now = new Date();

        for (let offset = count - 1; offset >= 0; offset -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            const key = monthKey(date);

            const monthBookings = reportBookings.filter((booking) => {
                const checkIn = parseDate(getCheckIn(booking));
                return checkIn && monthKey(checkIn) === key;
            });

            const revenue = monthBookings.reduce((sum, booking) => {
                return sum + (
                    getPaymentStatus(booking) === "Paid"
                        ? getTotal(booking)
                        : getPaid(booking)
                );
            }, 0);

            months.push({
                month: monthLabel(date),
                bookings: monthBookings.length,
                revenue
            });
        }

        return months;
    }, [reportBookings, period]);

    const paymentData = useMemo(() => {
        const counts = reportBookings.reduce((result, booking) => {
            const status = getPaymentStatus(booking);
            result[status] = (result[status] || 0) + 1;
            return result;
        }, {});

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));
    }, [reportBookings]);

    const statusData = useMemo(() => {
        const counts = reportBookings.reduce((result, booking) => {
            const status = getBookingStatus(booking);
            result[status] = (result[status] || 0) + 1;
            return result;
        }, {});

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));
    }, [reportBookings]);

    const exportCsv = () => {
        const headers = [
            "Booking ID",
            "Guest",
            "Check-in",
            "Check-out",
            "Booking Status",
            "Payment Status",
            "Total Amount",
            "Amount Paid",
            "Balance"
        ];

        const rows = reportBookings.map((booking) => [
            booking?.bookingCode ||
                booking?.reservationCode ||
                booking?.bookingId ||
                booking?._id ||
                booking?.id ||
                "",
            getGuestName(booking),
            formatDate(getCheckIn(booking)),
            formatDate(getCheckOut(booking)),
            getBookingStatus(booking),
            getPaymentStatus(booking),
            getTotal(booking).toFixed(2),
            getPaid(booking).toFixed(2),
            Math.max(0, getTotal(booking) - getPaid(booking)).toFixed(2)
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map(escapeCsv).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `trio-majestica-report-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const exportGraphsPdf = async () => {
        if (!chartsRef.current) return;

        try {
            const canvas = await html2canvas(chartsRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true
            });

            const image = canvas.toDataURL("image/png");
            const pdf = new jsPDF("landscape", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const imageWidth = pageWidth - margin * 2;
            const imageHeight = (canvas.height * imageWidth) / canvas.width;
            const availableHeight = pageHeight - margin * 2;

            if (imageHeight <= availableHeight) {
                pdf.addImage(image, "PNG", margin, margin, imageWidth, imageHeight);
            } else {
                const scale = availableHeight / imageHeight;
                pdf.addImage(
                    image,
                    "PNG",
                    margin,
                    margin,
                    imageWidth * scale,
                    imageHeight * scale
                );
            }

            pdf.save(`trio-majestica-graphs-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            setError("Unable to export graphs to PDF. Please try again.");
        }
    };

    return (
        <div className="rd-layout">
            <Sidebar />

            <main className="receptionist-dashboard reports-page">
                <header className="reports-header">
                    <div>
                        <h1>Reports</h1>
                        <p>Review hotel performance, reservations, and payment records.</p>
                    </div>

                    <div className="reports-header-actions">
                        <Tooltip title="Refresh report data">
                            <span>
                                <Button
                                    className="reports-refresh-button"
                                    startIcon={
                                        refreshing ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <RefreshRounded />
                                        )
                                    }
                                    onClick={() => fetchBookings(true)}
                                    disabled={loading || refreshing}
                                >
                                    Refresh
                                </Button>
                            </span>
                        </Tooltip>

                        <Button
                            className="reports-export-button"
                            startIcon={<FileDownloadRounded />}
                            onClick={exportCsv}
                            disabled={loading || reportBookings.length === 0}
                        >
                            Export Table CSV
                        </Button>

                        <Button
                            className="reports-pdf-button"
                            startIcon={<FileDownloadRounded />}
                            onClick={exportGraphsPdf}
                            disabled={loading || reportBookings.length === 0}
                        >
                            Export Graph PDF
                        </Button>
                    </div>
                </header>

                {error && (
                    <Alert
                        severity="error"
                        className="reports-alert"
                        onClose={() => setError("")}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => fetchBookings(true)}
                            >
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                <section className="reports-toolbar">
                    <div>
                        <span className="reports-toolbar-label">Report period</span>
                        <Select
                            size="small"
                            value={period}
                            onChange={(event) => setPeriod(event.target.value)}
                            className="reports-select"
                            aria-label="Report period"
                        >
                            <MenuItem value="1">This month</MenuItem>
                            <MenuItem value="3">Last 3 months</MenuItem>
                            <MenuItem value="6">Last 6 months</MenuItem>
                            <MenuItem value="12">Last 12 months</MenuItem>
                            <MenuItem value="all">All available records</MenuItem>
                        </Select>
                    </div>

                    <div>
                        <span className="reports-toolbar-label">Report category</span>
                        <Select
                            size="small"
                            value={reportType}
                            onChange={(event) => setReportType(event.target.value)}
                            className="reports-select"
                            aria-label="Report category"
                        >
                            <MenuItem value="all">All records</MenuItem>
                            <MenuItem value="payments">Paid bookings</MenuItem>
                            <MenuItem value="unpaid">Unpaid bookings</MenuItem>
                            <MenuItem value="visits">Guest visits</MenuItem>
                        </Select>
                    </div>
                </section>

                <section className="reports-stats-grid">
                    <Paper className="reports-stat-card" elevation={0}>
                        <div className="reports-stat-icon reports-icon-revenue">
                            <PaymentsRounded />
                        </div>
                        <div className="reports-stat-copy">
                            <span>Recorded Revenue</span>
                            <strong>{currency.format(stats.totalRevenue)}</strong>
                            <small>Based on recorded payments</small>
                        </div>
                        <TrendingUpRounded className="reports-stat-decoration" />
                    </Paper>

                    <Paper className="reports-stat-card" elevation={0}>
                        <div className="reports-stat-icon reports-icon-balance">
                            <FileDownloadRounded />
                        </div>
                        <div className="reports-stat-copy">
                            <span>Outstanding Balance</span>
                            <strong>{currency.format(stats.outstandingBalance)}</strong>
                            <small>Remaining unpaid amount</small>
                        </div>
                    </Paper>

                    <Paper className="reports-stat-card" elevation={0}>
                        <div className="reports-stat-icon reports-icon-bookings">
                            <EventAvailableRounded />
                        </div>
                        <div className="reports-stat-copy">
                            <span>Total Bookings</span>
                            <strong>{stats.totalBookings}</strong>
                            <small>Bookings in selected report</small>
                        </div>
                    </Paper>

                    <Paper className="reports-stat-card" elevation={0}>
                        <div className="reports-stat-icon reports-icon-guests">
                            <HotelRounded />
                        </div>
                        <div className="reports-stat-copy">
                            <span>Currently Checked In</span>
                            <strong>{stats.checkedIn}</strong>
                            <small>Guests with checked-in status</small>
                        </div>
                    </Paper>
                </section>

                {loading ? (
                    <div className="reports-loading">
                        <CircularProgress />
                        <span>Loading report data...</span>
                    </div>
                ) : (
                    <>
                        <section className="reports-chart-grid" ref={chartsRef}>
                            <Paper className="reports-panel reports-revenue-panel" elevation={0}>
                                <div className="reports-panel-heading">
                                    <div>
                                        <h2>Bookings &amp; Revenue</h2>
                                        <p>Monthly reservation volume and recorded revenue</p>
                                    </div>
                                </div>

                                <div className="reports-chart reports-bar-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={monthlyData}
                                            margin={{
                                                top: 12,
                                                right: 12,
                                                left: 8,
                                                bottom: 4
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#eee7e8"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: "#7b7376", fontSize: 12 }}
                                            />
                                            <YAxis
                                                yAxisId="bookings"
                                                allowDecimals={false}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: "#7b7376", fontSize: 12 }}
                                            />
                                            <YAxis
                                                yAxisId="revenue"
                                                orientation="right"
                                                hide
                                            />
                                            <ChartTooltip
                                                formatter={(value, name) =>
                                                    name === "Revenue"
                                                        ? currency.format(value)
                                                        : [value, name]
                                                }
                                                contentStyle={{
                                                    borderRadius: 10,
                                                    border: "1px solid #eee3e6"
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                yAxisId="bookings"
                                                dataKey="bookings"
                                                name="Bookings"
                                                fill="#bd9656"
                                                radius={[5, 5, 0, 0]}
                                                maxBarSize={34}
                                            />
                                            <Bar
                                                yAxisId="revenue"
                                                dataKey="revenue"
                                                name="Revenue"
                                                fill="#7b1735"
                                                radius={[5, 5, 0, 0]}
                                                maxBarSize={34}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Paper>

                            <Paper className="reports-panel reports-payment-panel" elevation={0}>
                                <div className="reports-panel-heading">
                                    <div>
                                        <h2>Payment Overview</h2>
                                        <p>Payment status distribution</p>
                                    </div>
                                </div>

                                {paymentData.length === 0 ? (
                                    <div className="reports-empty-chart">
                                        No payment records available.
                                    </div>
                                ) : (
                                    <div className="reports-chart reports-pie-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={paymentData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="46%"
                                                    innerRadius={62}
                                                    outerRadius={92}
                                                    paddingAngle={3}
                                                >
                                                    {paymentData.map((entry, index) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Paper>
                        </section>

                        <section className="reports-bottom-grid">
                            <Paper className="reports-panel reports-status-panel" elevation={0}>
                                <div className="reports-panel-heading">
                                    <div>
                                        <h2>Booking Status Summary</h2>
                                        <p>Current status of reservations in this report</p>
                                    </div>
                                </div>

                                {statusData.length === 0 ? (
                                    <div className="reports-empty-chart">
                                        No booking records available.
                                    </div>
                                ) : (
                                    <div className="reports-status-list">
                                        {statusData.map((item, index) => {
                                            const percent = stats.totalBookings
                                                ? (item.value / stats.totalBookings) * 100
                                                : 0;

                                            return (
                                                <div
                                                    className="reports-status-row"
                                                    key={item.name}
                                                >
                                                    <div className="reports-status-row-top">
                                                        <span>
                                                            <i
                                                                style={{
                                                                    backgroundColor:
                                                                        COLORS[index % COLORS.length]
                                                                }}
                                                            />
                                                            {item.name}
                                                        </span>
                                                        <strong>{item.value}</strong>
                                                    </div>
                                                    <div className="reports-progress-track">
                                                        <span
                                                            style={{
                                                                width: `${percent}%`,
                                                                backgroundColor:
                                                                    COLORS[index % COLORS.length]
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Paper>

                            <Paper className="reports-panel reports-recent-panel" elevation={0}>
                                <div className="reports-panel-heading">
                                    <div>
                                        <h2>Recent Report Records</h2>
                                        <p>Latest bookings included in the report</p>
                                    </div>
                                    <span className="reports-record-count">
                                        {reportBookings.length} records
                                    </span>
                                </div>

                                {reportBookings.length === 0 ? (
                                    <div className="reports-empty-chart">
                                        No records match the selected filters.
                                    </div>
                                ) : (
                                    <div className="reports-table-wrap">
                                        <table className="reports-table">
                                            <thead>
                                                <tr>
                                                    <th>Guest</th>
                                                    <th>Check-in</th>
                                                    <th>Payment</th>
                                                    <th className="reports-amount-cell">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...reportBookings]
                                                    .sort((a, b) => {
                                                        const dateA = parseDate(getCheckIn(a))?.getTime() || 0;
                                                        const dateB = parseDate(getCheckIn(b))?.getTime() || 0;
                                                        return dateB - dateA;
                                                    })
                                                    .slice(0, 8)
                                                    .map((booking, index) => (
                                                        <tr key={booking?._id || booking?.id || index}>
                                                            <td>
                                                                <div className="reports-guest-cell">
                                                                    <span className="reports-guest-avatar">
                                                                        {getGuestName(booking).charAt(0).toUpperCase()}
                                                                    </span>
                                                                    <div>
                                                                        <strong>{getGuestName(booking)}</strong>
                                                                        <small>
                                                                            {booking?.bookingCode ||
                                                                                booking?.reservationCode ||
                                                                                booking?.bookingId ||
                                                                                "Booking"}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{formatDate(getCheckIn(booking))}</td>
                                                            <td>
                                                                <span
                                                                    className={`reports-payment-badge reports-payment-${getPaymentStatus(booking)
                                                                        .toLowerCase()
                                                                        .replace(/\s+/g, "-")}`}
                                                                >
                                                                    {getPaymentStatus(booking)}
                                                                </span>
                                                            </td>
                                                            <td className="reports-amount-cell">
                                                                {currency.format(getTotal(booking))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Paper>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}