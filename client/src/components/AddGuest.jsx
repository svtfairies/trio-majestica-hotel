import { useState } from "react";
import axios from "axios";
import "../styles/GuestTable.css";

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    idType: "",
    idNumber: "",
    notes: "",
};

const ID_TYPES = [
    "Passport",
    "National ID",
    "Driver's License",
    "Other",
];

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export default function AddGuest({
    open,
    onClose,
    onGuestAdded,
}) {
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [errors, setErrors] = useState({});
    const [saveError, setSaveError] = useState("");
    const [saving, setSaving] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        action: null,
    });

    const hasChanges = () =>
        Object.keys(EMPTY_FORM).some(
            (key) => String(form[key] ?? "") !== ""
        );

    const handleChange = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: "",
        }));

        setSaveError("");
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!form.firstName.trim()) {
            nextErrors.firstName = "First name is required.";
        }

        if (!form.lastName.trim()) {
            nextErrors.lastName = "Last name is required.";
        }

        if (!form.phone.trim()) {
            nextErrors.phone = "Phone number is required.";
        }

        if (!form.idType) {
            nextErrors.idType = "Please select an ID type.";
        }

        if (form.idType === "Other" && !form.customIdType.trim()) {
            nextErrors.customIdType = "Please specify the ID type.";
        }

        if (
            form.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim()
            )
        ) {
            nextErrors.email = "Enter a valid email address.";
        }

        if (
            form.dateOfBirth &&
            form.dateOfBirth > today()
        ) {
            nextErrors.dateOfBirth =
                "Date of birth cannot be in the future.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setErrors({});
        setSaveError("");

        setConfirmDialog({
            open: false,
            action: null,
        });
    };

    const handleClose = () => {
        if (saving) return;

        resetForm();
        onClose?.();
    };

    const handleRequestClose = () => {
        if (saving || confirmDialog.open) return;

        if (hasChanges()) {
            setConfirmDialog({
                open: true,
                action: "cancel",
            });
        } else {
            handleClose();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (saving || !validateForm()) return;

        setSaveError("");

        setConfirmDialog({
            open: true,
            action: "save",
        });
    };

    const handleConfirmNo = () => {
        if (saving) return;

        setConfirmDialog({
            open: false,
            action: null,
        });
    };

    const handleConfirmYes = async () => {
        const action = confirmDialog.action;

        if (saving) return;

        if (action === "cancel") {
            handleClose();
            return;
        }

        if (action !== "save") return;

        if (!validateForm()) {
            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        try {
            setSaving(true);
            setSaveError("");

            const payload = {
                ...form,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                nationality: form.nationality.trim(),
                idType:
                    form.idType === "Other"
                        ? form.customIdType.trim()
                        : form.idType,
                idNumber: form.idNumber.trim(),
                notes: form.notes.trim(),
                dateOfBirth: form.dateOfBirth || null,
            };

            const response = await axios.post(
                `${API_URL}/guests`,
                payload
            );

            const guest =
                response.data?.guest ?? response.data;

            if (!guest?._id) {
                throw new Error(
                    "The server did not return the saved guest record."
                );
            }

            setConfirmDialog({
                open: false,
                action: null,
            });

            onGuestAdded?.(guest);

            resetForm();
            onClose?.();
        } catch (error) {
            console.error("Failed to add guest:", error);

            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError(
                error.response?.data?.message ||
                error.message ||
                "Failed to add guest. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const renderField = ({
        name,
        label,
        type = "text",
        required = false,
        multiline = false,
        minRows,
    }) => (
        <TextField
            className="guest-modal-field"
            fullWidth
            name={name}
            label={label}
            type={type}
            required={required}
            multiline={multiline}
            minRows={minRows}
            value={form[name] ?? ""}
            onChange={(event) =>
                handleChange(name, event.target.value)
            }
            error={Boolean(errors[name])}
            helperText={errors[name] || ""}
            slotProps={
                type === "date"
                    ? {
                        inputLabel: {
                            shrink: true,
                        },
                        htmlInput: {
                            max: today(),
                        },
                    }
                    : undefined
            }
        />
    );

    return (
        <>
            <Dialog
                className="guest-edit-modal"
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
                <DialogTitle className="guest-modal-header">
                    <Box>
                        <Typography className="guest-modal-title">
                            Add Guest
                        </Typography>

                        <Typography className="guest-modal-subtitle">
                            Enter the new guest's personal information.
                        </Typography>
                    </Box>

                    <IconButton
                        className="guest-modal-close"
                        aria-label="Close add guest dialog"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    dividers
                    className="guest-modal-content"
                >
                    {saveError && (
                        <Alert
                            severity="error"
                            className="guest-save-error"
                        >
                            {saveError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        id="add-guest-form"
                        onSubmit={handleSubmit}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "firstName",
                                    label: "First Name",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "lastName",
                                    label: "Last Name",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "email",
                                    label: "Email",
                                    type: "email",
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "phone",
                                    label: "Phone Number",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "dateOfBirth",
                                    label: "Date of Birth",
                                    type: "date",
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "nationality",
                                    label: "Nationality",
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    className="guest-modal-field"
                                    select
                                    fullWidth
                                    required
                                    label="ID Type"
                                    value={form.idType}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        handleChange("idType", value);

                                        if (value !== "Other") {
                                            handleChange("customIdType", "");
                                        }
                                    }}
                                    error={Boolean(errors.idType)}
                                    helperText={errors.idType || ""}
                                    InputLabelProps={{ shrink: true }}
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: (selected) =>
                                            selected || "Choose ID Type",
                                    }}
                                    sx={{
                                        minWidth: 180,
                                        "& .MuiInputBase-root": {
                                            height: 56,
                                        },
                                        "& .MuiSelect-select": {
                                            minWidth: "140px",
                                            display: "flex",
                                            alignItems: "center",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            boxSizing: "border-box",
                                        },
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Choose ID Type
                                    </MenuItem>

                                    {ID_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {form.idType === "Other" && (
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        className="guest-modal-field"
                                        fullWidth
                                        required
                                        label="Specify ID Type"
                                        placeholder="Enter ID type"
                                        value={form.customIdType}
                                        onChange={(event) =>
                                            handleChange("customIdType", event.target.value)
                                        }
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "idNumber",
                                    label: "ID Number",
                                })}
                            </Grid>

                            <Grid item xs={12}>
                                {renderField({
                                    name: "notes",
                                    label: "Notes",
                                    multiline: true,
                                    minRows: 3,
                                })}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions className="guest-modal-actions">
                    <Button
                        className="guest-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="guest-modal-save"
                        variant="contained"
                        type="submit"
                        form="add-guest-form"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Add Guest"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="guest-confirm-dialog"
                open={confirmDialog.open}
                onClose={handleConfirmNo}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="guest-confirm-title">
                    {confirmDialog.action === "save"
                        ? "Confirm Add Guest"
                        : "Discard Changes?"}
                </DialogTitle>

                <DialogContent className="guest-confirm-content">
                    <Typography>
                        {confirmDialog.action === "save"
                            ? "Are you sure you want to save this guest's information?"
                            : "Are you sure you want to discard your changes? Any unsaved information will be lost."}
                    </Typography>
                </DialogContent>

                <DialogActions className="guest-confirm-actions">
                    <Button
                        className="guest-confirm-no"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleConfirmNo}
                    >
                        No
                    </Button>

                    <Button
                        className="guest-confirm-yes"
                        variant="contained"
                        disabled={saving}
                        onClick={handleConfirmYes}
                    >
                        {saving
                            ? "Saving..."
                            : confirmDialog.action === "save"
                                ? "Yes, Save"
                                : "Yes, Discard"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
