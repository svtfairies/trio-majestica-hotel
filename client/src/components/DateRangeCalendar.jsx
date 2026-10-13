
import { useEffect, useMemo, useState } from "react";
import "../styles/DateRangeCalendar.css";

const pad = (value) => String(value).padStart(2, "0");
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateKey = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const monthLabel = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export default function DateRangeCalendar({ checkIn, checkOut, onApply, minDate }) {
    const [open, setOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(monthStart(fromDateKey(checkIn) || fromDateKey(minDate) || new Date()));
    const [draftStart, setDraftStart] = useState(checkIn);
    const [draftEnd, setDraftEnd] = useState(checkOut);

    useEffect(() => {
        if (!open) {
            setDraftStart(checkIn);
            setDraftEnd(checkOut);
        }
    }, [checkIn, checkOut, open]);

    const secondMonth = useMemo(() => shiftMonth(visibleMonth, 1), [visibleMonth]);
    const displayValue = checkIn && checkOut ? `${checkIn} – ${checkOut}` : "Select check-in and check-out dates";

    const openCalendar = () => {
        setDraftStart(checkIn);
        setDraftEnd(checkOut);
        setVisibleMonth(monthStart(fromDateKey(checkIn) || fromDateKey(minDate) || new Date()));
        setOpen(true);
    };

    const selectDate = (key) => {
        if (!draftStart || (draftStart && draftEnd)) {
            setDraftStart(key);
            setDraftEnd("");
            return;
        }
        if (key <= draftStart) {
            setDraftStart(key);
            setDraftEnd("");
            return;
        }
        setDraftEnd(key);
    };

    const renderMonth = (month) => {
        const firstDay = month.getDay();
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);

        return (
            <div className="drc-month" key={month.toISOString()}>
                <div className="drc-month-title">{monthLabel(month)}</div>
                <div className="drc-weekdays">{weekdayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                <div className="drc-days">
                    {cells.map((day, index) => {
                        if (!day) return <span className="drc-empty" key={`empty-${index}`} />;
                        const date = new Date(month.getFullYear(), month.getMonth(), day);
                        const key = toDateKey(date);
                        const disabled = Boolean(minDate && key < minDate);
                        const isStart = key === draftStart;
                        const isEnd = key === draftEnd;
                        const inRange = draftStart && draftEnd && key > draftStart && key < draftEnd;

                        return (
                            <button type="button" key={key} disabled={disabled} className={["drc-day", isStart ? "drc-start" : "", isEnd ? "drc-end" : "", inRange ? "drc-in-range" : ""].filter(Boolean).join(" ")} onClick={() => selectDate(key)} aria-label={key} aria-pressed={isStart || isEnd}>{day}</button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="drc-wrapper">
            <button type="button" className="drc-trigger" onClick={openCalendar}>
                <span className="drc-trigger-label">Check-in / Check-out</span>
                <span className="drc-trigger-value">{displayValue}</span>
                <span className="drc-trigger-icon">▦</span>
            </button>

            {open && (
                <div className="drc-overlay" onClick={() => setOpen(false)}>
                    <section className="drc-dialog" role="dialog" aria-modal="true" aria-label="Choose reservation dates" onClick={(event) => event.stopPropagation()}>
                        <div className="drc-selected-summary">{draftStart || "Check-in"}{" "}{draftEnd ? `– ${draftEnd}` : "– Select check-out"}</div>
                        
                        <div className="drc-navigation">
                            <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}>‹</button>
                            <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}>›</button>
                        </div>

                        <div className="drc-months">{renderMonth(visibleMonth)}{renderMonth(secondMonth)}</div>
                        
                        <div className="drc-footer">
                            <button type="button" className="drc-cancel" onClick={() => setOpen(false)}>Cancel</button>
                            <button type="button" className="drc-apply" disabled={!draftStart || !draftEnd || draftEnd <= draftStart} onClick={() => { onApply(draftStart, draftEnd); setOpen(false); }}>Apply</button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}