import { useState } from "react";
import axios from "axios";
import "../styles/InventoryTable.css";

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
    TextField,
    Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const EMPTY_FORM = {
    itemName: "",
    quantityInStock: "",
    reorderStockLevel: "100",
    supplier: "",
    location: "",
};

export default function AddInventory({
    open,
    onClose,
    onInventoryAdded,
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
        Object.values(form).some(
            (value, index) =>
                String(value ?? "") !==
                Object.values(EMPTY_FORM)[index]
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

        if (!form.itemName.trim()) {
            nextErrors.itemName = "Item name is required.";
        }

        if (
            form.quantityInStock === "" ||
            !Number.isInteger(Number(form.quantityInStock)) ||
            Number(form.quantityInStock) < 0
        ) {
            nextErrors.quantityInStock =
                "Enter a whole number of 0 or greater.";
        }

        if (
            form.reorderStockLevel === "" ||
            !Number.isInteger(Number(form.reorderStockLevel)) ||
            Number(form.reorderStockLevel) < 0
        ) {
            nextErrors.reorderStockLevel =
                "Enter a whole number of 0 or greater.";
        }

        if (!form.supplier.trim()) {
            nextErrors.supplier = "Supplier is required.";
        }

        if (!form.location.trim()) {
            nextErrors.location = "Location is required.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setErrors({});
        setSaveError("");
        setConfirmDialog({ open: false, action: null });
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
                itemName: form.itemName.trim(),
                quantityInStock: Number(form.quantityInStock),
                reorderStockLevel: Number(form.reorderStockLevel),
                supplier: form.supplier.trim(),
                location: form.location.trim(),
            };

            const response = await axios.post(
                `${API_URL}/inventory`,
                payload
            );

            const inventory =
                response.data?.inventory ?? response.data;

            if (!inventory?._id) {
                throw new Error(
                    "The server did not return the saved inventory record."
                );
            }

            setConfirmDialog({
                open: false,
                action: null,
            });

            onInventoryAdded?.(inventory);
            resetForm();
            onClose?.();
        } catch (error) {
            console.error("Failed to add inventory item:", error);

            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError(
                error.response?.data?.message ||
                error.message ||
                "Failed to add item. Please try again."
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
        helperText,
    }) => (
        <TextField
            className="inventory-modal-field"
            fullWidth
            name={name}
            label={label}
            type={type}
            required={required}
            value={form[name]}
            onChange={(event) =>
                handleChange(name, event.target.value)
            }
            error={Boolean(errors[name])}
            helperText={errors[name] || helperText || ""}
            slotProps={
                type === "number"
                    ? {
                        htmlInput: {
                            min: 0,
                            step: 1,
                        },
                    }
                    : undefined
            }
        />
    );

    return (
        <>
            <Dialog
                className="inventory-edit-modal"
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
                <DialogTitle className="inventory-modal-header">
                    <Box>
                        <Typography className="inventory-modal-title">
                            Add Inventory Item
                        </Typography>

                        <Typography className="inventory-modal-subtitle">
                            Enter the details for the new inventory item.
                        </Typography>
                    </Box>

                    <IconButton
                        className="inventory-modal-close"
                        aria-label="Close add inventory dialog"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    dividers
                    className="inventory-modal-content"
                >
                    {saveError && (
                        <Alert
                            severity="error"
                            className="inventory-form-error"
                        >
                            {saveError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        id="add-inventory-form"
                        onSubmit={handleSubmit}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "itemName",
                                    label: "Item Name",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "quantityInStock",
                                    label: "Quantity in Stock",
                                    type: "number",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "reorderStockLevel",
                                    label: "Reorder Stock Level",
                                    type: "number",
                                    required: true,
                                    helperText:
                                        "Default reorder level is 100.",
                                })}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {renderField({
                                    name: "supplier",
                                    label: "Supplier",
                                    required: true,
                                })}
                            </Grid>

                            <Grid item xs={12}>
                                {renderField({
                                    name: "location",
                                    label: "Storage Location",
                                    required: true,
                                })}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions className="inventory-modal-actions">
                    <Button
                        className="inventory-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleRequestClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="inventory-modal-save"
                        variant="contained"
                        type="submit"
                        form="add-inventory-form"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Add Item"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="inventory-confirm-dialog"
                open={confirmDialog.open}
                onClose={handleConfirmNo}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="inventory-confirm-title">
                    {confirmDialog.action === "save"
                        ? "Confirm Add Item"
                        : "Discard Changes?"}
                </DialogTitle>

                <DialogContent className="inventory-confirm-content">
                    <Typography>
                        {confirmDialog.action === "save"
                            ? "Are you sure you want to add this inventory item?"
                            : "Are you sure you want to discard your changes? Any unsaved information will be lost."}
                    </Typography>
                </DialogContent>

                <DialogActions className="inventory-confirm-actions">
                    <Button
                        className="inventory-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleConfirmNo}
                    >
                        No
                    </Button>

                    <Button
                        className="inventory-delete-confirm-button"
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