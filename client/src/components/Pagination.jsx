import { useMemo } from "react";
import { IconButton, MenuItem, Select, Tooltip } from "@mui/material";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import "../styles/Pagination.css";

export default function Pagination({ table, totalItems, pageSizeOptions = [5, 10, 20, 50], className = "" }) {
    const pagination = table.getState().pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const filteredCount = totalItems ?? table.getFilteredRowModel().rows.length;
    const currentRows = table.getRowModel().rows.length;
    const range = useMemo(() => {
        const start = currentRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
        const end = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount);
        return { start, end };
    }, [currentRows, filteredCount, pagination.pageIndex, pagination.pageSize]);

    return (
        <div className={`pagination-component container-fluid ${className}`.trim()}>
            <div className="pagination-summary col-auto">Showing <strong>{range.start}-{range.end}</strong> of <strong>{filteredCount}</strong> reservations</div>
            <div className="pagination-controls d-flex align-items-center justify-content-end flex-wrap gap-2">
                <nav className="pagination-buttons d-flex align-items-center gap-1" aria-label="Pagination navigation">
                    <Tooltip title="First page">
                        <span>
                            <IconButton className="pagination-nav-button" size="small" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page"><FirstPageRoundedIcon fontSize="small" /></IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Previous page">
                        <span>
                            <IconButton className="pagination-nav-button" size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><KeyboardArrowLeftRoundedIcon fontSize="small" /></IconButton>
                        </span>
                    </Tooltip>

                    <span className="pagination-page-label text-nowrap">Page {pagination.pageIndex + 1} of {pageCount}</span>
                    
                    <Tooltip title="Next page">
                        <span>
                            <IconButton className="pagination-nav-button" size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><KeyboardArrowRightRoundedIcon fontSize="small" /></IconButton>
                        </span>
                    </Tooltip>
                    
                    <Tooltip title="Last page">
                        <span>
                            <IconButton className="pagination-nav-button" size="small" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()} aria-label="Last page"><LastPageRoundedIcon fontSize="small" /></IconButton>
                        </span>
                    </Tooltip>
                </nav>
            </div>
        </div>
    );
}