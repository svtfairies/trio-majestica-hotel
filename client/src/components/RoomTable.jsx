import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/RoomTable.css";
import CloseIcon from "@mui/icons-material/Close";

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
    Chip,
    IconButton,
} from "@mui/material";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ROOM_STATUSES = [
    "Available",
    "Fully Booked",
    "Maintenance",
    "Inactive",
];

export default function RoomTable({
    searchQuery = "",
    selectedFilter = "All Statuses",
}) {
    const [rooms, setRooms] = useState([]);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        action: null,
    });

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        room: null,
    });

    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await axios.get(`${API_URL}/rooms`);

                const roomData = Array.isArray(response.data)
                    ? response.data
                    : response.data?.rooms;

                setRooms(Array.isArray(roomData) ? roomData : []);
            } catch (error) {
                console.error("Failed to fetch rooms:", error);
                setRooms([]);
            }
        };

        fetchRooms();
    }, []);

    const filteredData = useMemo(() => {
        const query = String(searchQuery ?? "")
            .trim()
            .toLowerCase();

        const normalizedFilter = String(selectedFilter ?? "all")
            .trim()
            .toLowerCase();

        return rooms.filter((room) => {
            const roomName = String(room.name ?? "").toLowerCase();
            const bedType = String(room.bedType ?? "").toLowerCase();

            const status = String(room.status ?? "")
                .trim()
                .toLowerCase();

            const matchesSearch =
                roomName.includes(query) ||
                bedType.includes(query);

            const matchesStatus =
                !normalizedFilter ||
                normalizedFilter === 'all' ||
                status === normalizedFilter

            return matchesSearch && matchesStatus;
        });
    }, [rooms, searchQuery, selectedFilter]);

    const handleEdit = (room) => {
        setSelectedRoom(room);

        setEditForm({
            ...room,
            amenities: room.amenities || [],
            inclusions: room.inclusions || [],
        });

        setSaveError("");
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
            setSelectedRoom(null);
            setEditForm({});
            setSaveError("");
            return;
        }

        if (action !== "save") return;

        const requiredFields = [
            { name: "name", label: "Room Name" },
            { name: "bedType", label: "Bed Type" },
            { name: "capacity", label: "Capacity" },
            { name: "totalRooms", label: "Total Rooms" },
            { name: "pricePerNight", label: "Price Per Night" },
            { name: "status", label: "Status" },
            { name: "roomSize", label: "Room Size" },
            { name: "floor", label: "Floor" },
            { name: "view", label: "View" },
            { name: "bathroom", label: "Bathroom" },
            { name: "idealFor", label: "Ideal For" },
            { name: "highlight", label: "Highlight" },
            { name: "image", label: "Image URL" },
            { name: "description", label: "Description" },
            { name: "experience", label: "Room Experience" },
        ];

        const missingField = requiredFields.find(({ name }) => {
            const value = editForm[name];

            return (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            );
        });

        const hasAmenities = (editForm.amenities || []).some(
            (item) => String(item).trim()
        );

        const hasInclusions = (editForm.inclusions || []).some(
            (item) => String(item).trim()
        );

        if (missingField || !hasAmenities || !hasInclusions) {
            setSaveError(
                missingField
                    ? `${missingField.label} is required.`
                    : !hasAmenities
                        ? "At least one amenity is required."
                        : "At least one inclusion is required."
            );

            setConfirmDialog({
                open: false,
                action: null,
            });

            return;
        }

        if (!selectedRoom?._id) {
            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError("Unable to save: room ID is missing.");
            return;
        }

        try {
            setSaving(true);
            setSaveError("");

            const response = await axios.put(
                `${API_URL}/rooms/${selectedRoom._id}`,
                editForm
            );

            const updatedRoom = response.data.room;

            if (!updatedRoom?._id) {
                throw new Error(
                    "The server did not return the updated room."
                );
            }

            setRooms((previousRooms) =>
                previousRooms.map((room) =>
                    room._id === updatedRoom._id
                        ? updatedRoom
                        : room
                )
            );

            setConfirmDialog({
                open: false,
                action: null,
            });

            setOpenEditModal(false);
            setSelectedRoom(null);
            setEditForm({});
        } catch (error) {
            console.error("Failed to save room:", error);

            setConfirmDialog({
                open: false,
                action: null,
            });

            setSaveError(
                error.response?.data?.message ||
                error.message ||
                "Failed to save room changes. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const renderTextField = ({
        name,
        label,
        type = "text",
        multiline = false,
        minRows,
        placeholder,
        helperText,
        required = true,
    }) => (
        <TextField
            className="room-modal-field"
            fullWidth
            label={label}
            type={type}
            required={required}
            multiline={multiline}
            minRows={minRows}
            placeholder={placeholder}
            helperText={helperText}
            value={editForm[name] ?? ""}
            onChange={(event) => {
                const value = event.target.value;

                handleFormChange(
                    name,
                    type === "number"
                        ? value === ""
                            ? ""
                            : Number(value)
                        : value
                );
            }}
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

    const handleDeleteClick = (room) => {
        setDeleteError("");

        setDeleteDialog({
            open: true,
            room,
        });
    };

    const handleCancelDelete = () => {
        if (deleting) return;

        setDeleteDialog({
            open: false,
            room: null,
        });

        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        const room = deleteDialog.room;

        if (!room?._id || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await axios.delete(`${API_URL}/rooms/${room._id}`);

            setRooms((previousRooms) =>
                previousRooms.filter(
                    (item) => item._id !== room._id
                )
            );

            setDeleteDialog({
                open: false,
                room: null,
            });
        } catch (error) {
            console.error("Failed to delete room:", error);

            setDeleteError(
                error.response?.data?.message ||
                "Failed to delete the room. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Room Name",
                cell: ({getValue}) => (
                    <Typography className="room-name-cell">
                        {getValue()}
                    </Typography>
                )
            },
            {
                accessorKey: "bedType",
                header: "Bed Type",
            },
            {
                accessorKey: "capacity",
                header: "Capacity",
            },
            {
                accessorKey: "totalRooms",
                header: "Total Rooms",
            },
            {
                accessorKey: "pricePerNight",
                header: "Price per Night",
            },
            {
                accessorKey: "status",
                header: "Status",
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <>
                        <Button
                            onClick={() => handleEdit(row.original)}
                            className="room-edit-button"
                            variant="contained"
                        >
                            Edit
                        </Button>

                        <Button
                            className="room-delete-button"
                            variant="outlined"
                            disabled={deleting}
                            onClick={() =>
                                handleDeleteClick(row.original)
                            }
                        >
                            Delete
                        </Button>
                    </>
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

    const hasActiveFilters =
        String(searchQuery ?? "").trim() !== "" ||
        String(selectedFilter ?? "all").toLowerCase() !== "all";

    return (
        <Paper className="room-table-wrapper" elevation={0}>
            <TableContainer className="room-table-container">
                <Table className="room-table">
                    <TableHead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableCell key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableHead>

                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    align="center"
                                    className="room-empty-cell"
                                >
                                    {hasActiveFilters
                                        ? "No rooms match your search or selected status."
                                        : "No rooms found."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box className="room-table-pagination">
                <Button
                    className="pagination-prev"
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
                    className="pagination-next"
                    variant="contained"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                >
                    Next
                </Button>
            </Box>

            <Dialog
                className="room-edit-modal"
                open={openEditModal}
                onClose={() => {
                    if (!saving) handleConfirmAction("cancel");
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle className="room-modal-header">
                    <Box className="room-modal-heading">
                        <Typography className="room-modal-title">
                            Edit Room
                        </Typography>

                        <Typography className="room-modal-subtitle">
                            Update room information and amenities.
                        </Typography>
                    </Box>

                    <IconButton
                        className="room-modal-close"
                        aria-label="Close modal"
                        disabled={saving}
                        onClick={() => handleConfirmAction("cancel")}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    dividers
                    className="room-modal-content"
                >
                    {saveError && (
                        <Typography
                            className="room-save-error"
                            role="alert"
                        >
                            {saveError}
                        </Typography>
                    )}

                    {selectedRoom && (
                        <Box className="room-modal-form">
                            <Box className="room-modal-section">
                                {renderSectionTitle("Basic Information")}

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        {renderTextField({
                                            name: "name",
                                            label: "Room Name",
                                        })}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {renderTextField({
                                            name: "bedType",
                                            label: "Bed Type",
                                        })}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {renderTextField({
                                            name: "capacity",
                                            label: "Capacity",
                                            type: "number",
                                        })}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {renderTextField({
                                            name: "totalRooms",
                                            label: "Total Rooms",
                                            type: "number",
                                        })}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {renderTextField({
                                            name: "pricePerNight",
                                            label: "Price Per Night",
                                            type: "number",
                                        })}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            className="room-modal-field"
                                            select
                                            fullWidth
                                            required
                                            label="Status"
                                            value={editForm.status || "Available"}
                                            onChange={(event) =>
                                                handleFormChange(
                                                    "status",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {ROOM_STATUSES.map((status) => (
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
                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "roomSize",
                                            label: "Room Size",
                                        })}
                                    </Box>

                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "floor",
                                            label: "Floor",
                                        })}
                                    </Box>

                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "view",
                                            label: "View",
                                        })}
                                    </Box>

                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "bathroom",
                                            label: "Bathroom",
                                        })}
                                    </Box>

                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "idealFor",
                                            label: "Ideal For",
                                        })}
                                    </Box>

                                    <Box className="room-details-field">
                                        {renderTextField({
                                            name: "highlight",
                                            label: "Highlight",
                                        })}
                                    </Box>

                                    <Box className="room-details-field room-image-url">
                                        {renderTextField({
                                            name: "image",
                                            label: "Image URL",
                                        })}
                                    </Box>

                                    <Box className="room-details-field room-description">
                                        {renderTextField({
                                            name: "description",
                                            label: "Description",
                                            multiline: true,
                                            minRows: 4,
                                        })}
                                    </Box>

                                    <Box className="room-details-field room-experience">
                                        {renderTextField({
                                            name: "experience",
                                            label: "Room Experience",
                                            multiline: true,
                                            minRows: 4,
                                        })}
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="room-modal-section">
                                {renderSectionTitle("Amenities")}

                                <TextField
                                    className="room-modal-field"
                                    fullWidth
                                    multiline
                                    required
                                    minRows={2}
                                    label="Room Amenities"
                                    placeholder="Wi-Fi, Air Conditioning, Smart TV"
                                    helperText="Separate each amenity with a comma."
                                    value={(editForm.amenities || []).join(", ")}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "amenities",
                                            event.target.value
                                                .split(",")
                                                .map((item) => item.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                />

                                <Box className="room-modal-chips">
                                    {(editForm.amenities || []).map(
                                        (amenity, index) => (
                                            <Chip
                                                className="room-modal-chip"
                                                key={`${amenity}-${index}`}
                                                label={amenity}
                                            />
                                        )
                                    )}
                                </Box>
                            </Box>

                            <Box className="room-modal-section">
                                {renderSectionTitle("Inclusions")}

                                <TextField
                                    className="room-modal-field"
                                    fullWidth
                                    required
                                    multiline
                                    minRows={2}
                                    label="Room Inclusions"
                                    placeholder="Breakfast, Welcome Drinks, Parking"
                                    helperText="Separate each inclusion with a comma."
                                    value={(editForm.inclusions || []).join(", ")}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "inclusions",
                                            event.target.value
                                                .split(",")
                                                .map((item) => item.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                />

                                <Box className="room-modal-chips">
                                    {(editForm.inclusions || []).map(
                                        (item, index) => (
                                            <Chip
                                                className="room-modal-chip"
                                                key={`${item}-${index}`}
                                                label={item}
                                            />
                                        )
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions className="room-modal-actions">
                    <Button
                        className="room-modal-cancel"
                        variant="outlined"
                        disabled={saving}
                        onClick={() => handleConfirmAction("cancel")}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="room-modal-save"
                        variant="contained"
                        disabled={saving}
                        onClick={() => handleConfirmAction("save")}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="room-confirm-dialog"
                open={confirmDialog.open}
                onClose={handleCancelConfirmation}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="room-confirm-title">
                    {confirmDialog.action === "cancel"
                        ? "Discard Changes?"
                        : "Save Changes?"}
                </DialogTitle>

                <DialogContent className="room-confirm-content">
                    <Typography>
                        {confirmDialog.action === "cancel"
                            ? "Are you sure you want to discard your changes? Any unsaved edits will be lost."
                            : "Are you sure you want to save these room changes?"}
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
                            : confirmDialog.action === "save"
                                ? "Yes, Save"
                                : "Yes, Discard"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="room-confirm-dialog"
                open={deleteDialog.open}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="room-confirm-title">
                    Delete Room?
                </DialogTitle>

                <DialogContent className="room-confirm-content">
                    {deleteError && (
                        <Typography
                            className="room-save-error"
                            role="alert"
                        >
                            {deleteError}
                        </Typography>
                    )}

                    <Typography>
                        Are you sure you want to permanently delete{" "}
                        <strong>
                            {deleteDialog.room?.name || "this room"}
                        </strong>
                        ? This action cannot be undone.
                    </Typography>
                </DialogContent>

                <DialogActions className="room-confirm-actions">
                    <Button
                        className="room-confirm-no"
                        variant="outlined"
                        disabled={deleting}
                        onClick={handleCancelDelete}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="room-delete-confirm-button"
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