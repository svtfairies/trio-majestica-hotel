import { Button } from "@mui/material";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import InventoryTable from "../components/InventoryTable";
import AddInventory from "../components/AddInventory";

import "../styles/Inventory.css";

function Inventory() {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");

    const handleInventoryAdded = () => {
        setRefreshKey((previous) => previous + 1);
    };

    return (
        <div className="main-layout">
            <Sidebar />

            <div className="main-content-layout">
                <div className="main-content-header">
                    <h1 className="main-content-title">
                        Hotel Inventory
                    </h1>

                    <p className="main-content-body">
                        Manage the hotel's inventory details.
                    </p>
                </div>

                <div className="search-filter">
                    <div className="searchbar">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search inventory items"
                        />
                    </div>

                    <FilterDropdown
                        value={selectedFilter}
                        onChange={setSelectedFilter}
                        options={[
                            { label: "In Stock", value: "in stock" },
                            { label: "Low Stock", value: "low stock" },
                            { label: "Out of Stock", value: "out of stock" },
                        ]}
                    />
                </div>

                <div className="inventory-actions">
                    <Button
                        className="inventory-add-button"
                        variant="contained"
                        onClick={() => setOpenAddModal(true)}
                    >
                        + Add Item
                    </Button>
                </div>

                <InventoryTable
                    key={refreshKey}
                    searchQuery={searchQuery}
                    selectedFilter={selectedFilter}
                />

                <AddInventory
                    open={openAddModal}
                    onClose={() => setOpenAddModal(false)}
                    onInventoryAdded={handleInventoryAdded}
                />
            </div>
        </div>
    );
}

export default Inventory;