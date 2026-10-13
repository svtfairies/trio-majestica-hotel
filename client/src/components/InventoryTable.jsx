import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import "../styles/InventoryTable.css";

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

function InventoryTable({
  searchQuery = "",
  selectedFilter = "all",
}) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // Fetch inventory records from the backend
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await axios.get(`${API_URL}/inventory`);

      const records = Array.isArray(response.data)
        ? response.data
        : response.data?.inventory ?? [];

      setInventory(records);
    } catch (error) {
      console.error("Error fetching inventory:", error);

      setLoadError(
        error.response?.data?.message ||
        "Unable to load inventory. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);


  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inventory.filter((item) => {
      const itemName = (item.itemName || "").toLowerCase();
      const stockStatus = (item.stockStatus || "")
        .trim()
        .toLowerCase();

      const matchesSearch = itemName.includes(query);

      const filterValue = (selectedFilter || "all")
        .trim()
        .toLowerCase();

      const matchesFilter =
        filterValue === "all" ||
        filterValue === "" ||
        stockStatus === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchQuery, selectedFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setFormError("");
    setOpenEditModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    setFormData({
      itemName: item.itemName || "",
      quantityInStock: String(item.quantityInStock ?? ""),
      reorderStockLevel: String(item.reorderStockLevel ?? 100),
      supplier: item.supplier || "",
      location: item.location || "",
    });

    setFormError("");
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    if (saving) return;

    setOpenEditModal(false);
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update an inventory item
  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    const itemName = formData.itemName.trim();
    const supplier = formData.supplier.trim();
    const location = formData.location.trim();

    const quantity = Number(formData.quantityInStock);
    const reorderLevel = Number(formData.reorderStockLevel);

    if (!itemName || !supplier || !location) {
      setFormError(
        "Please fill in the item name, supplier, and location."
      );
      return;
    }

    if (
      formData.quantityInStock === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setFormError(
        "Quantity in stock must be a non-negative whole number."
      );
      return;
    }

    if (
      formData.reorderStockLevel === "" ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      setFormError(
        "Reorder level must be a non-negative whole number."
      );
      return;
    }

    const payload = {
      itemName,
      quantityInStock: quantity,
      reorderStockLevel: reorderLevel,
      supplier,
      location,
    };

    setSaving(true);

    try {
      if (editingItem) {
        const response = await axios.put(
          `${API_URL}/inventory/${editingItem._id}`,
          payload
        );

        const updatedItem =
          response.data?.inventory ?? response.data;

        setInventory((previous) =>
          previous.map((item) =>
            item._id === editingItem._id
              ? { ...item, ...updatedItem }
              : item
          )
        );
      } else {
        const response = await axios.post(
          `${API_URL}/inventory`,
          payload
        );

        const newItem =
          response.data?.inventory ?? response.data;

        setInventory((previous) => [
          newItem,
          ...previous,
        ]);
      }

      setOpenEditModal(false);
      setEditingItem(null);
      setFormData({ ...EMPTY_FORM });
      setFormError("");
    } catch (error) {
      console.error("Error saving inventory item:", error);

      setFormError(
        error.response?.data?.message ||
        "Unable to save the inventory item. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleting) return;

    setOpenDeleteModal(false);
    setDeletingItem(null);
  };

  // Delete an inventory item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setDeleting(true);

    try {
      await axios.delete(
        `${API_URL}/inventory/${deletingItem._id}`
      );

      setInventory((previous) =>
        previous.filter(
          (item) => item._id !== deletingItem._id
        )
      );

      setOpenDeleteModal(false);
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting inventory item:", error);

      setLoadError(
        error.response?.data?.message ||
        "Unable to delete the inventory item. Please try again."
      );

      setOpenDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "itemName",
        header: "Item Name",
        cell: ({ row }) => (
          <span className="inventory-item-name">
            {row.original.itemName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "quantityInStock",
        header: "Quantity",
        cell: ({ row }) =>
          row.original.quantityInStock ?? 0,
      },
      {
        accessorKey: "reorderStockLevel",
        header: "Reorder Level",
        cell: ({ row }) =>
          row.original.reorderStockLevel ?? 100,
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => row.original.supplier || "—",
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => row.original.location || "—",
      },
      {
        accessorKey: "stockStatus",
        header: "Stock Status",
        cell: ({ row }) => row.original.stockStatus || "Unknown",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="inventory-action-buttons">
            <Button
              className="inventory-edit-button"
              size="small"
              onClick={() => handleEdit(row.original)}
            >
              Edit
            </Button>

            <Button
              className="inventory-delete-button"
              size="small"
              onClick={() =>
                handleDeleteClick(row.original)
              }
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredInventory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // Return to the first page when the search/filter changes
  useEffect(() => {
    table.setPageIndex(0);
  }, [searchQuery, selectedFilter, table]);

  return (
    <Paper className="inventory-table-wrapper" elevation={0}>
      <TableContainer className="inventory-table-container">
        <Table className="inventory-table">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef
                          .header,
                        header.getContext()
                      )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                >
                  <Box className="inventory-table-loading">
                    <CircularProgress
                      size={26}
                      sx={{ color: "#5c1024" }}
                    />
                    <Typography>
                      Loading inventory...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                >
                  <Box className="inventory-table-message">
                    <Typography color="error">
                      {loadError}
                    </Typography>

                    <Button
                      className="inventory-retry-button"
                      variant="outlined"
                      onClick={fetchInventory}
                    >
                      Retry
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                >
                  <Typography className="inventory-empty-cell">
                    {searchQuery.trim()
                      ? "No inventory items match your search."
                      : selectedFilter !== "all"
                        ? "No items found for this stock status."
                        : "No inventory items found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
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
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading &&
        !loadError &&
        filteredInventory.length > 0 && (
          <Box className="inventory-table-pagination">
            <Typography variant="body2">
              Page{" "}
              {table.getState().pagination.pageIndex + 1}{" "}
              of {table.getPageCount()}
            </Typography>

            <Box>
              <Button
                className="inventory-pagination-prev"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>

              <Button
                className="inventory-pagination-next"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

      {/* Add/Edit Inventory Modal */}
      <Dialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="sm"
        className="inventory-edit-modal"
      >
        <DialogTitle className="inventory-modal-title">
          {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
        </DialogTitle>

        <DialogContent className="inventory-modal-content">
          {formError && (
            <Typography
              className="inventory-form-error"
              role="alert"
            >
              {formError}
            </Typography>
          )}

          <Box
            component="form"
            id="inventory-form"
            onSubmit={handleSave}
            className="inventory-form-fields"
          >
            <TextField
              label="Item Name"
              name="itemName"
              value={formData.itemName}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Quantity in Stock"
              name="quantityInStock"
              type="number"
              value={formData.quantityInStock}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              label="Reorder Level"
              name="reorderStockLevel"
              type="number"
              value={formData.reorderStockLevel}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              label="Supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              required
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>

        <DialogActions className="inventory-modal-actions">
          <Button
            className="inventory-modal-cancel"
            variant="outlined"
            onClick={handleCloseEditModal}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            className="inventory-modal-save"
            type="submit"
            form="inventory-form"
            variant="contained"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingItem
                ? "Save Changes"
                : "Add Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        fullWidth
        maxWidth="xs"
        className="inventory-delete-modal"
      >
        <DialogTitle className="inventory-modal-title">
          Delete Inventory Item
        </DialogTitle>

        <DialogContent className="inventory-modal-content">
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{deletingItem?.itemName}</strong>? This
            action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions className="inventory-modal-actions">
          <Button
            className="inventory-modal-cancel"
            variant="outlined"
            onClick={handleCloseDeleteModal}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            className="inventory-delete-confirm-button"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default InventoryTable;
