import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Button, CircularProgress, MenuItem, Paper, TextField, Checkbox, FormControlLabel, Dialog, DialogContent, DialogActions, IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import NightsStayRoundedIcon from "@mui/icons-material/NightsStayRounded";
import DateRangeCalendar from "../components/DateRangeCalendar";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import "../styles/ReservationForm.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const VAT_RATE = 0.12;
const SERVICES = [{ id: "breakfast", name: "Breakfast Package", price: 350 }, { id: "airport", name: "Airport Transfer", price: 800 }, { id: "extra-bed", name: "Extra Bed", price: 500 }, { id: "laundry", name: "Laundry Service", price: 250 }, { id: "spa", name: "Spa Package", price: 1200 }];
const INITIAL_FORM = { guestName: "", email: "", phone: "", roomId: "", roomType: "", roomNumber: "", checkIn: "", checkOut: "", adults: 1, children: 0, roomCount: 1, paymentMethod: "Cash", paymentType: "Full Payment", amountPaid: "", paymentReference: "", specialRequests: "" };

const getToken = () => localStorage.getItem("token");

const getRecords = (response) => {
    const data = response?.data;

    const candidates = [data, data?.rooms, data?.availableRooms, data?.data, data?.data?.rooms, data?.data?.availableRooms];
    return candidates.find(Array.isArray) || [];
};

const getRoomId = (room) => String(room?._id || room?.id || room?.roomId || "");

const getRoomType = (room) => room?.name || room?.roomType || room?.type || room?.category || "Room";

const getRoomRate = (room) => Number(room?.pricePerNight ?? room?.nightlyRate ?? room?.rate ?? room?.price ?? 0);

const getRoomCapacity = (room) => {

    const capacity = room?.capacity;
    if (typeof capacity === "number") return Math.max(1, capacity);

    const match = String(capacity || "").match(/\d+/);
    return match ? Math.max(1, Number(match[0])) : 2;
};

const getRoomTotal = (room) => Number(room?.availableRooms ?? room?.availableCount ?? room?.remainingRooms ?? room?.totalRooms ?? 0);

const getRoomImage = (room) => room?.image || room?.imageUrl || room?.photo || "";

const getRoomStatus = (room) => String(room?.status || room?.availability || "").toLowerCase();

const isAvailableStatus = (room) => ["", "available", "vacant", "active"].includes(getRoomStatus(room)) && getRoomTotal(room) > 0;

const getErrorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Something went wrong. Please try again.";

const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(Number(amount) || 0);

const countNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    const difference = new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime();
    return difference > 0 ? Math.round(difference / 86400000) : 0;
};

export default function ReservationForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL_FORM);
    const [rooms, setRooms] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const nights = useMemo(() => countNights(form.checkIn, form.checkOut), [form.checkIn, form.checkOut]);
    const selectedRoom = useMemo(() => rooms.find((room) => getRoomId(room) === String(form.roomId)), [rooms, form.roomId]);
    const guests = Number(form.adults) + Number(form.children);
    const roomCapacity = selectedRoom ? getRoomCapacity(selectedRoom) : 1;
    const roomsNeeded = selectedRoom ? Math.max(1, Math.ceil(guests / roomCapacity)) : 1;
    const roomRate = selectedRoom ? getRoomRate(selectedRoom) : 0;
    const roomSubtotal = roomRate * nights * Number(form.roomCount || 1);
    const serviceSubtotal = selectedServices.reduce((sum, serviceId) => sum + (SERVICES.find((service) => service.id === serviceId)?.price || 0) * nights, 0);
    const subtotal = roomSubtotal + serviceSubtotal;
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;
    const roomAvailable = selectedRoom ? getRoomTotal(selectedRoom) : 0;
    const roomSelectionInvalid = Boolean(selectedRoom && Number(form.roomCount) > roomAvailable);
    const [selectedRoomNumbers, setSelectedRoomNumbers] = useState([]);
    const [physicalRooms, setPhysicalRooms] = useState([]);
    const [loadingRoomNumbers, setLoadingRoomNumbers] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [createdReservation, setCreatedReservation] = useState(null);

    const getPhysicalRoomNumber = (room) => String(room?.roomNumber ?? room?.number ?? "");
    const getPhysicalRoomTypeId = (room) => String(room?.roomTypeId?._id ?? room?.roomTypeId ?? room?.roomType?._id ?? room?.roomType ?? room?.type ?? "");

    const amountPaid = form.paymentType === "Pay at Check-in" ? 0 : Number(form.amountPaid || 0);
    const remainingBalance = Math.max(0, total - amountPaid);
    const paymentStatus = amountPaid >= total ? "Paid" : amountPaid > 0 ? "Partially Paid" : "Unpaid";
    const paymentAmountInvalid = amountPaid < 0 || amountPaid > total || (form.paymentType === "Full Payment" && amountPaid !== total) || (form.paymentType === "Partial Payment" && (amountPaid <= 0 || amountPaid >= total));

    const setField = (field, value) => {
        setForm((previous) => ({ ...previous, [field]: value }));
        setErrors((previous) => ({ ...previous, [field]: "" }));
        setError("");
    };

    const fetchRooms = useCallback(async () => {
        if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
            setRooms([]);
            return;
        }
        const token = getToken();
        if (!token) {
            setError("Your session has expired. Please log in again.");
            navigate("/login");
            return;
        }
        setLoadingRooms(true);
        setError("");
        try {
            let response;
            
            const config = { headers: { Authorization: `Bearer ${token}` }, params: { checkIn: form.checkIn, checkOut: form.checkOut, checkInDate: form.checkIn, checkOutDate: form.checkOut } };
            try {
                response = await axios.get(`${API_URL}/rooms/available`, config);
            } catch (availableError) {
                if (![404, 405].includes(availableError?.response?.status)) throw availableError;
                response = await axios.get(`${API_URL}/rooms`, config);
            }
            
            const records = getRecords(response).filter(isAvailableStatus);
            setRooms(records);
            setForm((previous) => {
                const stillAvailable = records.some((room) => getRoomId(room) === String(previous.roomId));
                return stillAvailable ? previous : { ...previous, roomId: "", roomType: "", roomNumber: "" };
            });
            
            if (!records.length) 
                setError("No rooms are available for these dates. Try another date range.");
        } catch (fetchError) {
            const status = fetchError?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }
            
            setRooms([]);
            setError(`Unable to load rooms. ${getErrorMessage(fetchError)}`);
        } finally {
            setLoadingRooms(false);
        }
    }, [form.checkIn, form.checkOut, navigate]);

    useEffect(() => {
        if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
            setRooms([]);
            return undefined;
        }

        const timer = setTimeout(fetchRooms, 250);
        return () => clearTimeout(timer);
    }, [form.checkIn, form.checkOut, fetchRooms]);

    useEffect(() => {
        if (!selectedRoom) return;
        const required = Math.max(1, Math.ceil((Number(form.adults) + Number(form.children)) / getRoomCapacity(selectedRoom)));
        setForm((previous) => ({ ...previous, roomCount: required }));
    }, [form.adults, form.children, selectedRoom]);

    const handleDateApply = (checkIn, checkOut) => {
        setForm((previous) => ({ ...previous, checkIn, checkOut }));
        setErrors({});
        setError("");
        setSuccess("");
    };

    const handleRoomChange = (room) => {
        const required = Math.max(1, Math.ceil(guests / getRoomCapacity(room)));
        setForm((previous) => ({ ...previous, roomId: getRoomId(room), roomType: getRoomType(room), roomNumber: "", roomCount: required }));
        setErrors((previous) => ({ ...previous, roomId: "" }));
        setError("");
    };

    const validate = () => {
        const next = {};
        if (!form.guestName.trim()) 
            next.guestName = "Please enter the guest's full name.";

        if (!form.email.trim()) 
            next.email = "Please enter an email address.";

        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) 
            next.email = "Please enter a valid email address.";

        if (!form.phone.trim()) 
            next.phone = "Please enter a phone number.";

        if (!form.checkIn || !form.checkOut) 
            next.dates = "Please select check-in and check-out dates.";

        else if (form.checkIn < TODAY) 
            next.dates = "Check-in date cannot be in the past.";

        else if (form.checkOut <= form.checkIn) 
            next.dates = "Check-out must be after check-in.";

        if (!selectedRoom) 
            next.roomId = "Please select a room type.";

        if (!Number(form.adults) || Number(form.adults) < 1) 
            next.adults = "At least one adult is required.";

        if (Number(form.children) < 0) 
            next.children = "Children cannot be negative.";

        if (!Number(form.roomCount) || Number(form.roomCount) < roomsNeeded) 
            next.roomCount = `At least ${roomsNeeded} room(s) are needed for these guests.`;

        if (roomSelectionInvalid) 
            next.roomCount = `Only ${roomAvailable} room(s) are available for this room type.`;

        if (!nights || nights < 1) 
            next.dates = "Please select a valid stay period.";

        if (paymentAmountInvalid) {
            next.amountPaid = "Please enter a valid payment amount.";
        }

        if ((form.paymentMethod === "GCash" || form.paymentMethod === "Bank Transfer") && amountPaid > 0 && !form.paymentReference.trim()) {
            next.paymentReference = "Please enter the transaction reference number.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        
        if (!validate()) {
            const hasEmptyFields = !form.guestName.trim() && !form.email.trim() && !form.phone.trim() && !form.checkIn && !form.checkOut && !form.roomId;
            if (hasEmptyFields) 
                setError("Please complete the required fields before confirming the reservation.");
            
            return;
        }
        const token = getToken();
        if (!token) {
            setError("Your session has expired. Please log in again.");
            navigate("/login");
            return;
        }
        const reservationReference = `TM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const payload = {
            reservationReference,
            guestName: form.guestName.trim(),
            guestEmail: form.email.trim().toLowerCase(),
            guestPhone: form.phone.trim(),
            room: getRoomId(selectedRoom),
            roomId: getRoomId(selectedRoom),
            roomType: getRoomType(selectedRoom),
            rooms: Number(form.roomCount),
            roomCount: Number(form.roomCount),
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            adults: Number(form.adults),
            guests: Number(form.adults),
            totalGuests: guests,
            children: Number(form.children),
            paymentMethod: form.paymentMethod,
            services: selectedServices.map((serviceId) => {
                const service = SERVICES.find((item) => item.id === serviceId);
                return service ? { id: service.id, name: service.name, price: service.price } : null;
            }).filter(Boolean),
            roomRate,
            nights,
            roomSubtotal,
            serviceSubtotal,
            subtotal,
            vatRate: VAT_RATE,
            vat,
            total,
            specialRequests: form.specialRequests.trim(),
            paymentType: form.paymentType,
            amountPaid,
            remainingBalance,
            paymentStatus,
            paymentReference: form.paymentReference.trim(),
        };
        setSaving(true);
        
        try {
            await axios.post(`${API_URL}/bookings`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            setCreatedReservation({
                reference: reservationReference,
                guestName: form.guestName.trim(),
                roomType: getRoomType(selectedRoom),
                roomCount: Number(form.roomCount),
                checkIn: form.checkIn,
                checkOut: form.checkOut,
                nights,
                total,
                paymentMethod: form.paymentMethod
            });

            setSuccessModalOpen(true);
        } catch (submitError) {
            const status = submitError?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }
            setError(getErrorMessage(submitError));
            console.error("Create reservation failed:", submitError?.response?.data || submitError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rf-layout">
            <main className="rf-page">
                <header className="rf-page-header">
                    <div className="rf-heading">
                        <span className="rf-eyebrow">TRIO MAJESTICA HOTEL</span>
                        <h1>Create Room Reservation</h1>
                        <p>Register guests, select rooms, and customize their stay.</p>
                    </div>

                    <Button className="rf-back-button" variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/receptionist/reservations")}>Back to Reservations</Button>
                </header>

                {error && <Alert severity="error" className="rf-alert">{error}</Alert>}
                {success && <Alert severity="success" className="rf-alert">{success}</Alert>}
                
                <form onSubmit={handleSubmit} noValidate>
                    <div className="rf-main-grid">
                        <div className="rf-form-column">
                            <Paper elevation={0} className="rf-form-card">
                                <div className="rf-card-heading">
                                    <span className="rf-card-icon"><PersonRoundedIcon /></span>
                                    
                                    <div>
                                        <h2>Guest Information</h2>
                                        <p>Enter the primary guest's details.</p>
                                    </div>
                                </div>

                                <div className="rf-form-grid">
                                    <div className="rf-field rf-field-full">
                                        <label htmlFor="guestName">Full Name <span className="rf-required">*</span></label>
                                        <TextField id="guestName" fullWidth size="small" placeholder="Enter guest's full name" value={form.guestName} onChange={(event) => setField("guestName", event.target.value)} error={Boolean(errors.guestName)} helperText={errors.guestName} />
                                    </div>
                                    
                                    <div className="rf-field">
                                        <label htmlFor="email">Email Address <span className="rf-required">*</span></label>
                                        <TextField id="email" type="email" fullWidth size="small" placeholder="guest@example.com" value={form.email} onChange={(event) => setField("email", event.target.value)} error={Boolean(errors.email)} helperText={errors.email} />
                                    </div>
                                    
                                    <div className="rf-field">
                                        <label htmlFor="phone">Phone Number <span className="rf-required">*</span></label>
                                        <TextField id="phone" fullWidth size="small" placeholder="Enter contact number" value={form.phone} onChange={(event) => setField("phone", event.target.value)} error={Boolean(errors.phone)} helperText={errors.phone} />
                                    </div>
                                </div>
                            </Paper>

                            <Paper elevation={0} className="rf-form-card">
                                <div className="rf-card-heading"><span className="rf-card-icon"><EventAvailableRoundedIcon /></span><div><h2>Stay Details</h2><p>Choose dates and the number of guests.</p></div></div>
                                <div className="rf-form-grid">
                                    <div className="rf-field">
                                        <label>Check-in and Check-out Dates <span className="rf-required">*</span>
                                        </label><DateRangeCalendar checkIn={form.checkIn} checkOut={form.checkOut} minDate={TODAY} onApply={handleDateApply} />{errors.dates && <span className="rf-field-error">{errors.dates}</span>}
                                    </div>

                                    <div className="rf-date-range"><NightsStayRoundedIcon />
                                        <div>
                                            <strong>{nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"} selected` : "Select stay dates"}</strong>
                                            <span>{form.checkIn && form.checkOut ? `${form.checkIn} to ${form.checkOut}` : "Choose dates to continue."}</span>
                                        </div>
                                    </div>

                                    <div className="rf-field">
                                        <label htmlFor="adults">Adults <span className="rf-required">*</span></label>
                                        <TextField id="adults" type="number" fullWidth size="small" value={form.adults} slotProps={{ htmlInput: { min: 1, max: 10 } }} onChange={(event) => setField("adults", Math.max(1, Number(event.target.value) || 1))} error={Boolean(errors.adults)} helperText={errors.adults} />
                                    </div>

                                    <div className="rf-field">
                                        <label htmlFor="children">Children</label>
                                        <TextField id="children" type="number" fullWidth size="small" value={form.children} slotProps={{ htmlInput: { min: 1, max: 10 } }} onChange={(event) => setField("children", Math.max(0, Number(event.target.value) || 0))} error={Boolean(errors.children)} helperText={errors.children} />
                                    </div>
                                    
                                    <div className="rf-field rf-field-full">
                                        <label htmlFor="roomCount">Rooms Needed <span className="rf-required">*</span></label>
                                        <TextField id="roomCount" type="number" fullWidth size="small" value={form.roomCount} slotProps={{ htmlInput: { min: 1, max: 10 } }} onChange={(event) => setField("roomCount", Math.max(roomsNeeded, Number(event.target.value) || roomsNeeded))} error={Boolean(errors.roomCount)} helperText={errors.roomCount || `Based on ${guests} guest(s) and the selected room capacity.`} />
                                    </div>
                                </div>
                                <div className="rf-room-section">
                                    <div className="rf-room-heading"><div>
                                        <h3>Available Rooms</h3>
                                        <p>{form.checkIn && form.checkOut > form.checkIn ? `Availability for ${form.checkIn} to ${form.checkOut}` : "Select dates to check availability."}</p>
                                        
                                        </div>
                                            {loadingRooms && <CircularProgress size={22} sx={{ color: "#7b1735" }} />}
                                        </div>

                                    {errors.roomId && <span className="rf-field-error">{errors.roomId}</span>}
                                    
                                    {!loadingRooms && rooms.length > 0 && <div className="rf-room-grid">{rooms.map((room) => {
                                        const id = getRoomId(room);
                                        const selected = String(form.roomId) === id;
                                        const rate = getRoomRate(room);
                                        const capacity = getRoomCapacity(room);
                                        const available = getRoomTotal(room);
                                        const image = getRoomImage(room);
                                        return (
                                            <button type="button" key={id} className={`rf-room-option ${selected ? "selected" : ""}`} onClick={() => handleRoomChange(room)}>
                                                {image ? <img className="rf-room-image" src={image} alt={getRoomType(room)} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="rf-room-image-placeholder"><HotelRoundedIcon /></div>}
                                                <span className="rf-room-option-top">
                                                    <span className="rf-room-select-indicator">{selected ? "Selected" : "Select room"}</span>
                                                    <span className="rf-room-capacity">Up to {capacity} guests / room</span>
                                                </span>

                                                <strong>{getRoomType(room)}</strong>
                                                <span className="rf-room-available">{available} {available === 1 ? "room" : "rooms"} available</span>
                                                <span className="rf-room-rate">{formatCurrency(rate)}<small> / night</small></span>
                                                {selected && <span className="rf-room-selected-count">{form.roomCount} room(s) selected</span>}
                                            </button>
                                        );
                                    })}</div>}

                                    {!loadingRooms && form.checkIn && form.checkOut > form.checkIn && rooms.length === 0 && <div className="rf-empty-rooms"><HotelRoundedIcon /><strong>No available rooms</strong><span>Try another date range or check room availability in the database.</span></div>}
                                </div>
                            </Paper>

                            <Paper elevation={0} className="rf-form-card">
                                <div className="rf-card-heading">
                                    <span className="rf-card-icon"><HotelRoundedIcon /></span>
                                    <div>
                                        <h2>Select Room Numbers</h2>
                                        <p>Choose the exact available rooms for this reservation.</p>
                                    </div>
                                </div>
                                {!selectedRoom ? (
                                    <div className="rf-empty-rooms">
                                        <HotelRoundedIcon />
                                        <strong>Select a room type first</strong>
                                        <span>Available room numbers will appear here after selecting a room type.</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rf-room-number-summary">
                                            <span>Room type</span>
                                            <strong>{getRoomType(selectedRoom)}</strong>
                                            <span>Rooms required</span>
                                            <strong>{roomsNeeded}</strong>
                                            <span>Selected</span>
                                            <strong>{selectedRoomNumbers.length} of {roomsNeeded}</strong>
                                        </div>
                                        {loadingRoomNumbers ? (
                                            <CircularProgress size={24} sx={{ color: "#7b1735" }} />
                                        ) : physicalRooms.length === 0 ? (
                                            <div className="rf-empty-rooms">
                                                <strong>No room numbers available</strong>
                                                <span>Check the room inventory and booking dates.</span>
                                            </div>
                                        ) : (
                                            <div className="rf-room-number-grid">
                                                {physicalRooms.map((room) => {
                                                    const number = getPhysicalRoomNumber(room);
                                                    const selected = selectedRoomNumbers.includes(number);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={String(room._id || number)}
                                                            className={`rf-room-number-option ${selected ? "selected" : ""}`}
                                                            onClick={() => {
                                                                setSelectedRoomNumbers((previous) => {
                                                                    if (previous.includes(number)) {
                                                                        return previous.filter((item) => item !== number);
                                                                    }
                                                                    if (previous.length >= roomsNeeded) return previous;
                                                                    return [...previous, number];
                                                                });
                                                            }}>
                                                            <HotelRoundedIcon />
                                                            <strong>Room {number}</strong>
                                                            <span>{selected ? "Selected" : "Available"}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {selectedRoomNumbers.length !== roomsNeeded && (
                                            <p className="rf-room-number-hint">
                                                Select exactly {roomsNeeded} room{roomsNeeded === 1 ? "" : "s"} to continue.
                                            </p>
                                        )}
                                    </>
                                )}
                            </Paper>

                            <Paper elevation={0} className="rf-form-card">
                                <div className="rf-card-heading">
                                    <span className="rf-card-icon"><HotelRoundedIcon /></span>

                                    <div>
                                        <h2>Extra Room Services</h2>
                                        <p>Choose additional services for the guest's stay.</p>
                                    </div>
                                </div>

                                <div className="rf-service-grid">{SERVICES.map((service) => <div className={`rf-service-option ${selectedServices.includes(service.id) ? "selected" : ""}`} key={service.id}>
                                    <FormControlLabel control={<Checkbox checked={selectedServices.includes(service.id)} onChange={(event) => setSelectedServices((previous) => event.target.checked ? [...previous, service.id] : previous.filter((id) => id !== service.id))} sx={{ color: "#a56b7e", "&.Mui-checked": { color: "#7b1735" } }} />} label={<span className="rf-service-label">
                                    <strong>{service.name}</strong>
                                    <small>{formatCurrency(service.price)} / night</small></span>} /></div>)}
                                </div>
                                
                                <div className="rf-form-grid rf-extra-notes">
                                    <div className="rf-field rf-field-full">
                                        <label htmlFor="specialRequests">Special Requests</label>
                                        <TextField id="specialRequests" fullWidth multiline minRows={3} placeholder="Add guest requests or additional notes..." value={form.specialRequests} onChange={(event) => setField("specialRequests", event.target.value)} />
                                    </div>
                                </div>
                            </Paper>

                            <Paper elevation={0} className="rf-form-card">
                                <div className="rf-card-heading"><span className="rf-card-icon"><PaymentsRoundedIcon /></span><div><h2>Payment Preferences</h2><p>Choose the payment method and record the guest's payment.</p></div></div>
                                <div className="rf-form-grid">
                                    <div className="rf-field">
                                        <label htmlFor="paymentMethod">Payment Method <span className="rf-required">*</span></label>
                                        <TextField id="paymentMethod" select fullWidth size="small" value={form.paymentMethod} onChange={(event) => setField("paymentMethod", event.target.value)}>
                                            <MenuItem value="Cash">Cash</MenuItem>
                                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                                            <MenuItem value="Debit Card">Debit Card</MenuItem>
                                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="GCash">GCash</MenuItem>
                                        </TextField>
                                    </div>
                                    <div className="rf-field">
                                        <label htmlFor="paymentType">Payment Type <span className="rf-required">*</span></label>
                                        <TextField id="paymentType" select fullWidth size="small" value={form.paymentType} onChange={(event) => { setField("paymentType", event.target.value); if (event.target.value === "Full Payment") setField("amountPaid", String(total.toFixed(2))); else if (event.target.value === "Pay at Check-in") setField("amountPaid", "0"); else setField("amountPaid", ""); }}>
                                            <MenuItem value="Full Payment">Full Payment</MenuItem>
                                            <MenuItem value="Partial Payment">Partial Payment</MenuItem>
                                            <MenuItem value="Pay at Check-in">Pay at Check-in</MenuItem>
                                        </TextField>
                                    </div>
                                    {form.paymentType !== "Pay at Check-in" && (
                                        <div className="rf-field">
                                            <label htmlFor="amountPaid">Amount to Pay (PHP) <span className="rf-required">*</span></label>
                                            <TextField id="amountPaid" type="number" fullWidth size="small" value={form.amountPaid} inputProps={{ min: 0, max: total, step: "0.01" }} onChange={(event) => setField("amountPaid", event.target.value)} error={Boolean(errors.amountPaid) || paymentAmountInvalid} helperText={errors.amountPaid || (paymentAmountInvalid ? "Enter a valid amount for the selected payment type." : `Total due: ${formatCurrency(total)}`)} />
                                        </div>
                                    )}
                                    {(form.paymentMethod === "GCash" || form.paymentMethod === "Bank Transfer") && (
                                        <div className="rf-field">
                                            <label htmlFor="paymentReference">Transaction Reference Number</label>
                                            <TextField id="paymentReference" fullWidth size="small" value={form.paymentReference} onChange={(event) => setField("paymentReference", event.target.value)} placeholder="Enter transaction reference" />
                                        </div>
                                    )}
                                </div>
                                <div className="rf-payment-breakdown">
                                    <div><span>Total Amount Due</span><strong>{formatCurrency(total)}</strong></div>
                                    <div><span>Amount to Pay</span><strong>{formatCurrency(amountPaid)}</strong></div>
                                    <div><span>Remaining Balance</span><strong>{formatCurrency(remainingBalance)}</strong></div>
                                    <div><span>Payment Status</span><strong className={`rf-payment-status ${paymentStatus.toLowerCase().replace(/\s+/g, "-")}`}>{paymentStatus}</strong></div>
                                </div>
                            </Paper>
                        </div>

                        <aside className="rf-summary-column">
                            <Paper elevation={0} className="rf-payment-summary">
                                <div className="rf-summary-header">
                                    <span className="rf-summary-icon"><PaymentsRoundedIcon /></span>

                                    <div>
                                        <h2>Payment Summary</h2>
                                        <p>Reservation cost breakdown</p>
                                    </div>
                                </div>
                                <div className="rf-summary-room">
                                    <span className="rf-summary-room-icon"><HotelRoundedIcon /></span>

                                    <div>
                                        <strong>{selectedRoom ? getRoomType(selectedRoom) : "No room selected"}</strong>
                                        <span>{form.roomCount} room(s) · {roomCapacity} guests per room</span>
                                    </div>
                                </div>
                                
                                <div className="rf-summary-dates">
                                    <div>
                                        <span>CHECK-IN</span>
                                        <strong>{form.checkIn || "Not selected"}</strong>
                                    </div>

                                    <div>
                                        <span>CHECK-OUT</span>
                                        <strong>{form.checkOut || "Not selected"}</strong>
                                    </div>
                                </div>

                                <div className="rf-summary-line">
                                    <span>Adults</span>
                                    <strong>{form.adults}</strong>
                                </div>
                                <div className="rf-summary-line">
                                    <span>Children</span>
                                    <strong>{form.children}</strong>
                                </div>
                                
                                <div className="rf-summary-line">
                                    <span>Total Guests</span>
                                    <strong>{guests}</strong>
                                </div>
                                
                                <div className="rf-summary-line">
                                    <span>Rooms Needed</span>
                                    <strong>{form.roomCount}</strong>
                                </div>
                                
                                <div className="rf-summary-line">
                                    <span>Room Rate per Night</span>
                                    <strong>{formatCurrency(roomRate)}</strong>
                                </div>

                                <div className="rf-summary-line">
                                    <span>Nights</span>
                                    <strong>{nights}</strong>
                                </div>

                                <div className="rf-summary-line">
                                    <span>Total Price</span>
                                    <strong>{formatCurrency(roomSubtotal)}</strong>
                                </div>

                                <div className="rf-summary-line">
                                    <span>Extra services</span>
                                    <strong>{formatCurrency(serviceSubtotal)}</strong>
                                </div>
                                
                                {selectedServices.map((id) => {
                                    const service = SERVICES.find((item) => item.id === id);
                                    return service ? <div className="rf-summary-service" key={id}><span>{service.name}</span><strong>{formatCurrency(service.price * nights)}</strong></div> : null;
                                })}

                                <div className="rf-summary-line">
                                    <span>Subtotal</span>
                                    <strong>{formatCurrency(subtotal)}</strong>
                                </div>
                                
                                <div className="rf-summary-line">
                                    <span>VAT (12%)</span>
                                    <strong>{formatCurrency(vat)}</strong>
                                </div>
                                
                                <div className="rf-summary-line">
                                    <span>Payment method</span>
                                    <strong>{form.paymentMethod}</strong>
                                </div>
                                
                                <div className="rf-summary-divider" />
                                
                                <div className="rf-summary-total">
                                    <div>
                                        <span>Total payment</span>
                                        <small>Includes 12% VAT</small>
                                    </div>

                                    <strong>{formatCurrency(total)}</strong>
                                </div>

                                <Button type="submit" fullWidth variant="contained" className="rf-submit-button" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />} disabled={saving || loadingRooms || !selectedRoom || nights < 1 || roomSelectionInvalid}>{saving ? "Saving Reservation..." : "Confirm Reservation"}</Button>
                            </Paper>
                        </aside>
                    </div>
                </form>

                <Dialog open={successModalOpen} onClose={() => {}} fullWidth maxWidth="sm" PaperProps={{ className: "rf-success-dialog" }}>
                    <IconButton className="rf-success-close" onClick={() => navigate("/receptionist/reservations", { state: { message: "Reservation created successfully." } })} aria-label="Close success dialog">
                        <CloseRoundedIcon />
                    </IconButton>
                    <DialogContent className="rf-success-content">
                        <div className="rf-success-icon">
                            <CheckCircleRoundedIcon />
                        </div>
                        <span className="rf-success-eyebrow">TRIO MAJESTICA HOTEL</span>
                        <h2>Reservation Successful!</h2>
                        <p className="rf-success-description">The room reservation has been saved successfully.</p>
                        {createdReservation && (
                            <>
                                <div className="rf-success-reference">
                                    <ConfirmationNumberRoundedIcon />
                                    <div>
                                        <span>Reservation Reference</span>
                                        <strong>{createdReservation.reference}</strong>
                                    </div>
                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(createdReservation.reference)} aria-label="Copy reservation reference">
                                        <icon name="copy" />
                                    </IconButton>
                                </div>
                                <div className="rf-success-details">
                                    <div><span>Guest Name</span><strong>{createdReservation.guestName}</strong></div>
                                    <div><span>Room Type</span><strong>{createdReservation.roomType}</strong></div>
                                    <div><span>Rooms Reserved</span><strong>{createdReservation.roomCount}</strong></div>
                                    <div><span>Check-in</span><strong>{createdReservation.checkIn}</strong></div>
                                    <div><span>Check-out</span><strong>{createdReservation.checkOut}</strong></div>
                                    <div><span>Duration</span><strong>{createdReservation.nights} night(s)</strong></div>
                                    <div><span>Payment Method</span><strong>{createdReservation.paymentMethod}</strong></div>
                                </div>
                                <div className="rf-success-total">
                                    <span>Total Reservation Amount</span>
                                    <strong>{formatCurrency(createdReservation.total)}</strong>
                                </div>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions className="rf-success-actions">
                        <Button fullWidth variant="contained" onClick={() => navigate("/receptionist/reservations", { state: { message: "Reservation created successfully." } })}>
                            Go to Reservations
                        </Button>
                    </DialogActions>
                </Dialog>
            </main>
        </div>
    );
}