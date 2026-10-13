import { useEffect, useState } from "react";
import "../styles/Notifications.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api/notifications";

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch notifications.");
            }

            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            setError(err.message || "Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const toggleRead = async (notification) => {
        const previousReadStatus = notification.read;
        const newReadStatus = !previousReadStatus;

        setError("");

        setNotifications((previous) =>
            previous.map((item) =>
                item._id === notification._id
                    ? { ...item, read: newReadStatus }
                    : item
            )
        );

        try {
            const response = await fetch(
                `${API_URL}/${notification._id}/read`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        read: newReadStatus,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update notification.");
            }

            const updatedNotification = await response.json();

            setNotifications((previous) =>
                previous.map((item) =>
                    item._id === notification._id
                        ? updatedNotification
                        : item
                )
            );
        } catch (err) {
        
            setNotifications((previous) =>
                previous.map((item) =>
                    item._id === notification._id
                        ? { ...item, read: previousReadStatus }
                        : item
                )
            );

            setError(err.message || "Unable to update notification.");
        }
    };

    const markAllAsRead = async () => {
        try {
            setError("");

            const response = await fetch(`${API_URL}/read-all`, {
                method: "PATCH",
            });

            if (!response.ok) {
                throw new Error("Failed to mark all notifications as read.");
            }

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    read: true,
                }))
            );
        } catch (err) {
            setError(err.message || "Unable to update notifications.");
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="main-layout">
            
            <Sidebar />

            <div className="main-content-layout">
                <div className="notification-panel">
                    <div className="notification-toolbar">
                        <div className="notification-toolbar-info">
                            <h2 className="notification-content-title">Notifications</h2>
                            <p className="notification-content-title">
                                {
                                    notifications.filter(
                                        (item) => !item.read
                                    ).length
                                }{" "}
                                unread notification(s)
                            </p>
                        </div>

                        <button
                            type="button"
                            className="notification-mark-all"
                            onClick={markAllAsRead}
                            disabled={
                                notifications.length === 0 ||
                                notifications.every(
                                    (item) => item.read
                                )
                            }
                        >
                            Mark all as read
                        </button>
                    </div>

                    {error && (
                        <div className="notification-error">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={fetchNotifications}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <p className="notification-status">
                            Loading notifications...
                        </p>
                    ) : notifications.length === 0 ? (
                        <p className="notification-status">
                            No notifications yet.
                        </p>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((notification) => (
                                <div
                                    className={`notification-item ${
                                        notification.read
                                            ? "is-read"
                                            : "is-unread"
                                    }`}
                                    key={notification._id}
                                >
                                    <div className="notification-indicator">
                                        {!notification.read && (
                                            <span className="notification-unread-dot" />
                                        )}
                                    </div>

                                    <div className="notification-content">
                                        <div className="notification-item-top">
                                            <span className="notification-category">
                                                {notification.category.replace(
                                                    "-",
                                                    " "
                                                )}
                                            </span>

                                            <span className="notification-date">
                                                {formatDate(
                                                    notification.notificationDate
                                                )}
                                            </span>
                                        </div>

                                        <h3 className="notification-title">
                                            {notification.title}
                                        </h3>

                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className={`read-checkbox ${
                                            notification.read
                                                ? "checked"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            toggleRead(notification)
                                        }
                                        aria-label={
                                            notification.read
                                                ? "Mark notification as unread"
                                                : "Mark notification as read"
                                        }
                                        aria-pressed={notification.read}
                                        title={
                                            notification.read
                                                ? "Mark as unread"
                                                : "Mark as read"
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Notification;