
import { useState } from "react";
import axios from "axios";
import "../styles/RoomTable.css";
import CloseIcon from "@mui/icons-material/Close";

import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Typography,
    IconButton,
} from "@mui/material";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
    name: "",
    description: "",
    bedType: "",
    capacity: "",
    totalRooms: "",
    pricePerNight: "",
    status: "Available",
    roomSize: "",
    floor: "",
    view: "",
    bathroom: "",
    idealFor: "",
    highlight: "",
    image: "",
    experience: "",
    amenities: [],
    inclusions: [],
};

export default function AddRoomModal({
    open,
    onClose,
    onRoomAdded,
}) {
    const [form, setForm] = useState({ ...initialForm });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState("add");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
        setError("");
    };

    const resetForm = () => {
        setForm({
            ...initialForm,
            amenities: [],
            inclusions: [],
        });
        setError("");
        setConfirmOpen(false);
    };

    const handleClose = () => {
        if (saving) return;

        resetForm();
        onClose();
    };

    const hasFormChanges = () =>
        Object.keys(initialForm).some((key) => {
            const current = form[key];
            const initial = initialForm[key];

            if (Array.isArray(initial)) {
                return current.length > 0;
            }

            return current !== initial;
        });

    const handleRequestClose = () => {
        if (saving) return;

        if (confirmOpen) {
            return;
        }

        if (hasFormChanges()) {
            setConfirmAction("cancel");
            setConfirmOpen(true);
        } else {
            handleClose();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError("");

        const requiredFields = [
            ["name", "Room Name"],
            ["description", "Description"],
            ["image", "Image URL"],
            ["bedType", "Bed Type"],
            ["capacity", "Capacity"],
            ["roomSize", "Room Size"],
            ["floor", "Floor"],
            ["view", "View"],
            ["bathroom", "Bathroom"],
            ["idealFor", "Ideal For"],
            ["highlight", "Highlight"],
            ["experience", "Room Experience"],
        ];

        const missingFields = requiredFields
            .filter(([field]) => !String(form[field] ?? "").trim())
            .map(([, label]) => label);

        if (missingFields.length > 0) {
            setError(
                `Please complete the following required fields: ${missingFields.join(", ")}.`
            );
            return;
        }

        if (form.amenities.length === 0) {
            setError("At least one room amenity is required.");
            return;
        }

        if (form.inclusions.length === 0) {
            setError("At least one room inclusion is required.");
            return;
        }

        if (
            form.totalRooms === "" ||
            !Number.isInteger(Number(form.totalRooms)) ||
            Number(form.totalRooms) < 0
        ) {
            setError(
                "Total Rooms must be a non-negative whole number."
            );
            return;
        }

        if (
            form.pricePerNight === "" ||
            !Number.isFinite(Number(form.pricePerNight)) ||
            Number(form.pricePerNight) < 0
        ) {
            setError(
                "Please enter a valid non-negative Price Per Night."
            );
            return;
        }

        setConfirmAction("add");
        setConfirmOpen(true);
    };

    const handleConfirmYes = async () => {
        if (saving) return;

        if (confirmAction === "cancel") {
            handleClose();
            return;
        }

        if (confirmAction !== "add") return;

        try {
            setSaving(true);
            setError("");

            const payload = {
                ...form,
                name: form.name.trim(),
                description: form.description.trim(),
                image: form.image.trim(),
                bedType: form.bedType.trim(),
                capacity: String(form.capacity).trim(),
                roomSize: form.roomSize.trim(),
                floor: form.floor.trim(),
                view: form.view.trim(),
                bathroom: form.bathroom.trim(),
                idealFor: form.idealFor.trim(),
                highlight: form.highlight.trim(),
                experience: form.experience.trim(),
                totalRooms: Number(form.totalRooms),
                pricePerNight: Number(form.pricePerNight),
                amenities: form.amenities,
                inclusions: form.inclusions,
                status: form.status || "Available",
            };

            const response = await axios.post(
                `${API_URL}/rooms`,
                payload
            );

            const newRoom = response.data.room;

            if (!newRoom?._id) {
                throw new Error(
                    "The server did not return the created room."
                );
            }

            setConfirmOpen(false);

            if (onRoomAdded) {
                onRoomAdded(newRoom);
            }

            resetForm();
            onClose();
        } catch (err) {
            console.error("Failed to add room:", err);

            setConfirmOpen(false);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to add room. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancelConfirmation = () => {
        if (saving) return;
        setConfirmOpen(false);
    };

    const renderField = ({
        name,
        label,
        type = "text",
        multiline = false,
        minRows,
        required = false,
    }) => (
        <TextField
            className="room-modal-field"
            fullWidth
            label={label}
            type={type}
            multiline={multiline}
            minRows={minRows}
            required={required}
            value={form[name] ?? ""}
            onChange={(event) =>
                handleChange(name, event.target.value)
            }
            slotProps={
                type === "number"
                    ? {
                        htmlInput: {
                            min: 0,
                            step:
                                name === "totalRooms" ? 1 : "any",
                        },
                    }
                    : undefined
            }
        />
    );

    const renderSectionTitle = (title) => (
        <Typography
            className="room-modal-section-title"
            variant="h3"
        >
            {title}
        </Typography>
    );

    const renderListField = (name, label, placeholder) => (
        <>
            <TextField
                className="room-modal-field"
                fullWidth
                multiline
                required
                minRows={2}
                label={label}
                placeholder={placeholder}
                helperText="Separate items with commas."
                value={form[name].join(", ")}
                onChange={(event) =>
                    handleChange(
                        name,
                        event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean)
                    )
                }
            />

            <Box className="room-modal-chips">
                {form[name].map((item, index) => (
                    <Chip
                        className="room-modal-chip"
                        key={`${item}-${index}`}
                        label={item}
                    />
                ))}
            </Box>
        </>
    );

    return (
        <>
            <Dialog
                className="room-edit-modal"
                open={open}
                onClose={(event, reason) => {
                    if (
                        reason === "backdropClick" ||
                        reason === "escapeKeyDown"
                    ) {
                        handleRequestClose();
                    }
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle className="room-modal-header">
                    <Box className="room-modal-heading">
                        <Typography className="room-modal-title">
                            Add Room
                        </Typography>

                        <Typography className="room-modal-subtitle">
                            Enter the details for the new room type.
                        </Typography>
                    </Box>

                    <IconButton
                        className="room-modal-close"
                        aria-label="Close modal"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    dividers
                    className="room-modal-content"
                >
                    {error && (
                        <Typography
                            className="room-save-error"
                            role="alert"
                        >
                            {error}
                        </Typography>
                    )}

                    <Box
                        component="form"
                        id="add-room-form"
                        className="room-modal-form"
                        onSubmit={handleSubmit}
                    >
                        <Box className="room-modal-section">
                            {renderSectionTitle("Basic Information")}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    {renderField({
                                        name: "name",
                                        label: "Room Name",
                                        required: true,
                                    })}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    {renderField({
                                        name: "bedType",
                                        label: "Bed Type",
                                        required: true,
                                    })}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    {renderField({
                                        name: "capacity",
                                        label: "Capacity",
                                        required: true,
                                    })}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    {renderField({
                                        name: "totalRooms",
                                        label: "Total Rooms",
                                        type: "number",
                                        required: true,
                                    })}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    {renderField({
                                        name: "pricePerNight",
                                        label: "Price Per Night",
                                        type: "number",
                                        required: true,
                                    })}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        className="room-modal-field"
                                        select
                                        fullWidth
                                        label="Status"
                                        value={form.status}
                                        onChange={(event) =>
                                            handleChange(
                                                "status",
                                                event.target.value
                                            )
                                        }
                                    >
                                        {[
                                            "Available",
                                            "Fully Booked",
                                            "Maintenance",
                                            "Inactive",
                                        ].map((status) => (
                                            <MenuItem
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box className="room-modal-section room-details-section">
                            {renderSectionTitle("Room Details")}

                            <Box className="room-details-grid">
                                {[
                                    ["roomSize", "Room Size"],
                                    ["floor", "Floor"],
                                    ["view", "View"],
                                    ["bathroom", "Bathroom"],
                                    ["idealFor", "Ideal For"],
                                    ["highlight", "Highlight"],
                                ].map(([name, label]) => (
                                    <Box
                                        className="room-details-field"
                                        key={name}
                                    >
                                        {renderField({
                                            name,
                                            label,
                                            required: true,
                                        })}
                                    </Box>
                                ))}

                                <Box className="room-details-field room-image-url">
                                    {renderField({
                                        name: "image",
                                        label: "Image URL",
                                        required: true,
                                    })}
                                </Box>

                                <Box className="room-details-field room-experience">
                                    {renderField({
                                        name: "experience",
                                        label: "Room Experience",
                                        multiline: true,
                                        minRows: 3,
                                        required: true,
                                    })}
                                </Box>

                                <Box className="room-details-field room-description">
                                    {renderField({
                                        name: "description",
                                        label: "Description",
                                        multiline: true,
                                        minRows: 3,
                                        required: true,
                                    })}
                                </Box>
                            </Box>
                        </Box>

                        <Box className="room-modal-section">
                            {renderSectionTitle("Amenities")}

                            {renderListField(
                                "amenities",
                                "Room Amenities",
                                "Wi-Fi, Air Conditioning, Smart TV"
                            )}
                        </Box>

                        <Box className="room-modal-section">
                            {renderSectionTitle("Inclusions")}

                            {renderListField(
                                "inclusions",
                                "Room Inclusions",
                                "Breakfast, Welcome Drinks, Parking"
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions className="room-modal-actions">
                    <Button
                        className="room-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="room-modal-save"
                        variant="contained"
                        type="submit"
                        form="add-room-form"
                        disabled={saving}
                    >
                        Add Room
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="room-confirm-dialog"
                open={confirmOpen}
                onClose={handleRequestClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="room-confirm-title">
                    {confirmAction === "cancel"
                        ? "Discard Changes?"
                        : "Confirm Add Room"}
                </DialogTitle>

                <DialogContent className="room-confirm-content">
                    <Typography>
                        {confirmAction === "cancel"
                            ? "Are you sure you want to discard your changes? Any unsaved entries will be lost."
                            : "Are you sure you want to save this room information?"}
                    </Typography>
                </DialogContent>

                <DialogActions className="room-confirm-actions">
                    <Button
                        className="room-confirm-no"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleCancelConfirmation}
                    >
                        No
                    </Button>

                    <Button
                        className="room-confirm-yes"
                        variant="contained"
                        disabled={saving}
                        onClick={handleConfirmYes}
                    >
                        {saving
                            ? "Saving..."
                            : confirmAction === "cancel"
                                ? "Yes, Discard"
                                : "Yes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
