import { useState } from "react";
import { Button } from "@mui/material";

import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import RoomTable from "../components/RoomTable";
import AddRoomModal from "../components/AddRoom";
import "../styles/RoomManagement.css";

function RoomManagement() {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");

    const handleRoomAdded = () => {
        setRefreshKey((previous) => previous + 1);
    };

    return (
        <div className="main-layout">

            <Sidebar />

            <div className="main-content-layout">
                <div className="main-content-header">
                    <h1 className="main-content-title">Room Management</h1>
                    <p className="main-content-body">
                        Manage the hotel's room information. View, add,
                        and update the room details.
                    </p>
                </div>

                <div className="search-filter">

                    <div className="searchbar">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search room name or bed type"
                        />
                    </div>

                    <FilterDropdown
                        value={selectedFilter}
                        onChange={setSelectedFilter}
                        options={[
                            { label: "Fully Booked", value: "fully booked" },
                            { label: "Available", value: "available" },
                            { label: "Maintenance", value: "maintenance" },
                            { label: "Inactive", value: "inactive" },
                        ]}
                    />

                </div>

                <div className="room-management-actions">
                    <Button
                        className="room-add-button"
                        variant="contained"
                        onClick={() => setOpenAddModal(true)}
                    >
                        + Add Room
                    </Button>
                </div>

                <RoomTable
                    key={refreshKey}
                    searchQuery={searchQuery}
                    selectedFilter={selectedFilter}
                />

                <AddRoomModal
                    open={openAddModal}
                    onClose={() => setOpenAddModal(false)}
                    onRoomAdded={handleRoomAdded}
                />
            </div>
        </div>
    );
}

export default RoomManagement;