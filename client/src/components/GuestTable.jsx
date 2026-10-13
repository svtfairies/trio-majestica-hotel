import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/GuestTable.css";

import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";

import {
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Button,
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const ID_TYPES = [
    "Passport",
    "National ID",
    "Driver's License",
    "Other",
];

const STANDARD_ID_TYPES = [
    "Passport",
    "National ID",
    "Driver's License",
];

const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    idType: "",
    customIdType: "",
    idNumber: "",
    notes: "",
};

const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const toLocalDateString = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export default function GuestTable({
    searchQuery = "",
    startDate = "",
    endDate = "",
}) {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        action: null,
    });

    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        guest: null,
    });

    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const fetchGuests = async () => {
        try {
            setLoading(true);
            setLoadError("");

            const response = await axios.get(`${API_URL}/guests`);

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.guests;

            setGuests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch guests:", error);

            setLoadError(
                error.response?.data?.message ||
                    "Failed to load guests. Please check your server connection."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    const filteredData = useMemo(() => {
        const query = String(searchQuery ?? "")
            .trim()
            .toLowerCase();

        return guests.filter((guest) => {
            const searchableFields = [
                guest.firstName,
                guest.lastName,
                `${guest.firstName ?? ""} ${guest.lastName ?? ""}`,
                guest.email,
                guest.phone,
                guest.nationality,
                guest.idType,
            ];

            const matchesSearch =
                !query ||
                searchableFields.some((field) =>
                    String(field ?? "").toLowerCase().includes(query)
                );

            const addedDateString = toLocalDateString(guest.addedDate);

            const matchesStartDate =
                !startDate ||
                (addedDateString !== "" && addedDateString >= startDate);

            const matchesEndDate =
                !endDate ||
                (addedDateString !== "" && addedDateString <= endDate);

            return (
                matchesSearch &&
                matchesStartDate &&
                matchesEndDate
            );
        });
    }, [guests, searchQuery, startDate, endDate]);

    const handleEdit = (guest) => {
        setSelectedGuest(guest);

        const existingIdType = guest.idType ?? "";
        const isStandardIdType =
            STANDARD_ID_TYPES.includes(existingIdType);

        setEditForm({
            firstName: guest.firstName ?? "",
            lastName: guest.lastName ?? "",
            email: guest.email ?? "",
            phone: guest.phone ?? "",
            dateOfBirth: guest.dateOfBirth
                ? String(guest.dateOfBirth).slice(0, 10)
                : "",
            nationality: guest.nationality ?? "",

            idType:
                existingIdType === ""
                    ? ""
                    : isStandardIdType
                        ? existingIdType
                        : "Other",

            customIdType: isStandardIdType ? "" : existingIdType,

            idNumber: guest.idNumber ?? "",
            notes: guest.notes ?? "",
        });

        setSaveError("");
        setConfirmDialog({ open: false, action: null });
        setOpenEditModal(true);
    };

    const handleFormChange = (field, value) => {
        setEditForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setSaveError("");
    };

    const handleConfirmAction = (action) => {
        setSaveError("");

        setConfirmDialog({
            open: true,
            action,
        });
    };

    const handleCancelConfirmation = () => {
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
            setConfirmDialog({
                open: false,
                action: null,
            });

            setOpenEditModal(false);
            setSelectedGuest(null);
            setEditForm({ ...EMPTY_FORM });
            setSaveError("");

            return;
        }

        if (action !== "save") return;

        if (
            !editForm.firstName.trim() ||
            !editForm.lastName.trim() ||
            !editForm.phone.trim()
        ) {
            setSaveError(
                "First name, last name, and phone number are required."
            );

            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        if (!editForm.idType) {
            setSaveError("Please select an ID Type.");

            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        if (
            editForm.idType === "Other" &&
            !editForm.customIdType.trim()
        ) {
            setSaveError("Please specify the ID Type.");

            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        if (
            editForm.dateOfBirth &&
            editForm.dateOfBirth > toLocalDateString(new Date())
        ) {
            setSaveError("Date of birth cannot be in the future.");

            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        if (!selectedGuest?._id) {
            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError("Unable to save: guest ID is missing.");

            return;
        }

        try {
            setSaving(true);
            setSaveError("");

            const payload = {
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim(),
                dateOfBirth: editForm.dateOfBirth || null,
                nationality: editForm.nationality.trim(),

                idType:
                    editForm.idType === "Other"
                        ? editForm.customIdType.trim()
                        : editForm.idType,

                idNumber: editForm.idNumber.trim(),
                notes: editForm.notes.trim(),
            };

            const response = await axios.put(
                `${API_URL}/guests/${selectedGuest._id}`,
                payload
            );

            const updatedGuest =
                response.data?.guest ?? response.data;

            if (!updatedGuest?._id) {
                throw new Error(
                    "The server did not return the updated guest."
                );
            }

            setGuests((previous) =>
                previous.map((guest) =>
                    guest._id === updatedGuest._id
                        ? updatedGuest
                        : guest
                )
            );

            setConfirmDialog({
                open: false,
                action: null,
            });

            setOpenEditModal(false);
            setSelectedGuest(null);
            setEditForm({ ...EMPTY_FORM });
            setSaveError("");
        } catch (error) {
            console.error("Failed to save guest:", error);

            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to save guest changes. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (guest) => {
        setDeleteError("");
        setDeleteDialog({ open: true, guest });
    };

    const handleCancelDelete = () => {
        if (deleting) return;

        setDeleteDialog({
            open: false,
            guest: null,
        });

        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        const guest = deleteDialog.guest;

        if (!guest?._id || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await axios.delete(`${API_URL}/guests/${guest._id}`);

            setGuests((previous) =>
                previous.filter((item) => item._id !== guest._id)
            );

            setDeleteDialog({
                open: false,
                guest: null,
            });
        } catch (error) {
            console.error("Failed to delete guest:", error);

            setDeleteError(
                error.response?.data?.message ||
                    "Failed to delete guest. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                id: "guestName",
                header: "Guest Name",
                accessorFn: (row) =>
                    `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
                cell: ({ row }) => (
                    <Typography className="guest-name-cell">
                        {row.original.firstName} {row.original.lastName}
                    </Typography>
                ),
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ getValue }) => getValue() || "—",
            },
            {
                accessorKey: "phone",
                header: "Phone Number",
                cell: ({ getValue }) => getValue() || "—",
            },
            {
                accessorKey: "nationality",
                header: "Nationality",
                cell: ({ getValue }) => getValue() || "—",
            },
            {
                accessorKey: "idType",
                header: "ID Type",
                cell: ({ getValue }) => getValue() || "—",
            },
            {
                accessorKey: "addedDate",
                header: "Added Date",
                cell: ({ getValue }) => formatDate(getValue()),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <Box className="guest-action-buttons">
                        <Button
                            className="guest-edit-button"
                            variant="contained"
                            onClick={() => handleEdit(row.original)}
                        >
                            Edit
                        </Button>

                        <Button
                            className="guest-delete-button"
                            variant="outlined"
                            disabled={deleting}
                            onClick={() =>
                                handleDeleteClick(row.original)
                            }
                        >
                            Delete
                        </Button>
                    </Box>
                ),
            },
        ],
        [deleting]
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: true,
        initialState: {
            pagination: {
                pageSize: 5,
            },
        },
    });

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
            label={label}
            type={type}
            required={required}
            multiline={multiline}
            minRows={minRows}
            value={editForm[name] ?? ""}
            onChange={(event) =>
                handleFormChange(name, event.target.value)
            }
            slotProps={
                type === "date"
                    ? {
                        inputLabel: { shrink: true },
                        htmlInput: {
                            max: toLocalDateString(new Date()),
                        },
                    }
                    : undefined
            }
        />
    );

    return (
        <Paper className="guest-table-wrapper" elevation={0}>
            {loadError && (
                <Box className="guest-table-message">
                    <Typography role="alert">{loadError}</Typography>

                    <Button
                        variant="outlined"
                        onClick={fetchGuests}
                        disabled={loading}
                    >
                        Retry
                    </Button>
                </Box>
            )}

            {loading ? (
                <Box className="guest-table-loading">
                    <CircularProgress size={28} />
                    <Typography>Loading guest records...</Typography>
                </Box>
            ) : (
                <>
                    <TableContainer className="guest-table-container">
                        <Table className="guest-table">
                            <TableHead>
                                {table.getHeaderGroups().map(
                                    (headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map(
                                                (header) => (
                                                    <TableCell key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext()
                                                            )}
                                                    </TableCell>
                                                )
                                            )}
                                        </TableRow>
                                    )
                                )}
                            </TableHead>

                            <TableBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(
                                                (cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                )
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            align="center"
                                            className="guest-empty-cell"
                                        >
                                            {searchQuery.trim() ||
                                            startDate ||
                                            endDate
                                                ? "No guests match your search or date range."
                                                : "No guests found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box className="guest-table-pagination">
                        <Button
                            className="guest-pagination-prev"
                            variant="outlined"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                        >
                            Prev
                        </Button>

                        <Typography>
                            Page{" "}
                            {table.getState().pagination.pageIndex + 1} of{" "}
                            {Math.max(table.getPageCount(), 1)}
                        </Typography>

                        <Button
                            className="guest-pagination-next"
                            variant="contained"
                            disabled={!table.getCanNextPage()}
                            onClick={() => table.nextPage()}
                        >
                            Next
                        </Button>
                    </Box>
                </>
            )}

            <Dialog
                className="guest-edit-modal"
                open={openEditModal}
                onClose={() => {
                    if (!saving) handleConfirmAction("cancel");
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle className="guest-modal-header">
                    <Box>
                        <Typography className="guest-modal-title">
                            Edit Guest
                        </Typography>

                        <Typography className="guest-modal-subtitle">
                            Update the guest's personal information.
                        </Typography>
                    </Box>

                    <IconButton
                        className="guest-modal-close"
                        aria-label="Close edit dialog"
                        disabled={saving}
                        onClick={() => handleConfirmAction("cancel")}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers className="guest-modal-content">
                    {saveError && (
                        <Typography
                            className="guest-save-error"
                            role="alert"
                        >
                            {saveError}
                        </Typography>
                    )}

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

                        <Grid item xs={12} sm={6}>
                            <TextField
                                className="guest-modal-field"
                                select
                                fullWidth
                                label="ID Type"
                                value={editForm.idType}
                                onChange={(event) => {
                                    const value = event.target.value;

                                    setEditForm((previous) => ({
                                        ...previous,
                                        idType: value,
                                        customIdType:
                                            value === "Other"
                                                ? previous.customIdType
                                                : "",
                                    }));

                                    setSaveError("");
                                }}
                                SelectProps={{
                                    displayEmpty: true,
                                    renderValue: (selected) =>
                                        selected || "Choose ID Type",
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

                        {editForm.idType === "Other" && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    className="guest-modal-field"
                                    fullWidth
                                    required
                                    label="Specify ID Type"
                                    placeholder="Enter ID type"
                                    value={editForm.customIdType}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "customIdType",
                                            event.target.value
                                        )
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
                </DialogContent>

                <DialogActions className="guest-modal-actions">
                    <Button
                        className="guest-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={() => handleConfirmAction("cancel")}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="guest-modal-save"
                        variant="contained"
                        disabled={saving}
                        onClick={() => handleConfirmAction("save")}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="guest-confirm-dialog"
                open={confirmDialog.open}
                onClose={handleCancelConfirmation}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="guest-confirm-title">
                    {confirmDialog.action === "cancel"
                        ? "Discard Changes?"
                        : "Save Changes?"}
                </DialogTitle>

                <DialogContent className="guest-confirm-content">
                    <Typography>
                        {confirmDialog.action === "cancel"
                            ? "Are you sure you want to discard your changes? Any unsaved edits will be lost."
                            : "Are you sure you want to save these guest changes?"}
                    </Typography>
                </DialogContent>

                <DialogActions className="guest-confirm-actions">
                    <Button
                        className="guest-confirm-no"
                        variant="outlined"
                        disabled={saving}
                        onClick={handleCancelConfirmation}
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
                            : confirmDialog.action === "cancel"
                                ? "Yes, Discard"
                                : "Yes, Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="guest-confirm-dialog"
                open={deleteDialog.open}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="guest-confirm-title">
                    Delete Guest?
                </DialogTitle>

                <DialogContent className="guest-confirm-content">
                    {deleteError && (
                        <Typography
                            className="guest-save-error"
                            role="alert"
                        >
                            {deleteError}
                        </Typography>
                    )}

                    <Typography>
                        Are you sure you want to permanently delete{" "}
                        <strong>
                            {deleteDialog.guest?.firstName}{" "}
                            {deleteDialog.guest?.lastName}
                        </strong>
                        ? This action cannot be undone.
                    </Typography>
                </DialogContent>

                <DialogActions className="guest-confirm-actions">
                    <Button
                        className="guest-confirm-no"
                        variant="outlined"
                        disabled={deleting}
                        onClick={handleCancelDelete}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="guest-delete-confirm-button"
                        variant="contained"
                        disabled={deleting}
                        onClick={handleConfirmDelete}
                    >
                        {deleting ? "Deleting..." : "Yes, Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
