import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function HotelLayout() {
    const navigate = useNavigate();

    return (
        <>
            <Sidebar onLogout={() => navigate("/login", { replace: true })} />
            <main className="hotel-main-content">
                <Outlet />
            </main>
        </>
    );
}
