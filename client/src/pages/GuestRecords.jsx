import { useState } from "react";
import { Button, Box, TextField, Typography } from "@mui/material";

import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import GuestTable from "../components/GuestTable";
import AddGuest from "../components/AddGuest";
import "../styles/GuestRecords.css";

function GuestRecords() {
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [openAddModal, setOpenAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const invalidDateRange =
        startDate && endDate && startDate > endDate;

    const clearDateRange = () => {
        setStartDate("");
        setEndDate("");
    };

    const handleGuestAdded = () => {
        setRefreshKey((previous) => previous + 1);
    };

    return (
        <div className="main-layout">
            <Sidebar />

            <div className="main-content-layout">
                <div className="main-content-header">
                    <h1 className="main-content-title">
                        Guest Records
                    </h1>

                    <p className="main-content-body">
                        Manage the hotel's guest information. View, add,
                        and update the guest details.
                    </p>
                </div>

                <div className="search-filter">
                    <div className="searchbar">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search guest name, email, phone, etc."
                        />
                    </div>

                    <Box className="guest-records-date-filter">
                        <TextField
                            className="guest-records-date-input"
                            label="Start Date"
                            type="date"
                            size="small"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(event.target.value)
                            }
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    max: endDate || undefined,
                                },
                            }}
                        />

                        <TextField
                            className="guest-records-date-input"
                            label="End Date"
                            type="date"
                            size="small"
                            value={endDate}
                            onChange={(event) =>
                                setEndDate(event.target.value)
                            }
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    min: startDate || undefined,
                                },
                            }}
                        />

                        <Button
                            className="guest-records-date-clear"
                            variant="outlined"
                            onClick={clearDateRange}
                            disabled={!startDate && !endDate}
                        >
                            Clear
                        </Button>
                    </Box>
                </div>

                {invalidDateRange && (
                    <Typography
                        className="guest-records-date-error"
                        role="alert"
                    >
                        Start date cannot be later than end date.
                    </Typography>
                )}

                <div className="guest-records-actions">
                    <Button
                        className="guest-add-button"
                        variant="contained"
                        onClick={() => setOpenAddModal(true)}
                    >
                        + Add Guest
                    </Button>
                </div>

                <div className="guest-records-table-section">
                    <GuestTable
                        key={refreshKey}
                        searchQuery={searchQuery}
                        startDate={invalidDateRange ? "" : startDate}
                        endDate={invalidDateRange ? "" : endDate}
                    />
                </div>

                <AddGuest
                    open={openAddModal}
                    onClose={() => setOpenAddModal(false)}
                    onGuestAdded={handleGuestAdded}
                />
            </div>
        </div>
    );
}

export default GuestRecords;