import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/WelcomePage.css";

const hotelImages = [
    "https://images.unsplash.com/photo-1776361984994-089a9df800f6?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775447665921-87fb172bf115?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775324537644-ec90f40d7d35?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1759038086397-2b7b1535da04?auto=format&fit=crop&fm=jpg&q=85&w=2400",
];

function WelcomePage() {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const [loadingPercent, setLoadingPercent] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const duration = 10000;

        const imageTimer = setInterval(() => {
            setCurrentImage((previous) => (previous + 1) % hotelImages.length);
        }, 2000);

        const loadingTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(
                Math.floor((elapsed / duration) * 100),
                100
            );

            setLoadingPercent(progress);

            if (progress >= 100) {
                clearInterval(loadingTimer);

                setTimeout(() => {
                    navigate("/login");
                }, 100);
            }
        }, 50);

        return () => {
            clearInterval(imageTimer);
            clearInterval(loadingTimer);
        };
    }, [navigate]);

    return (
        <main className="welcome-page">
            {hotelImages.map((image, index) => (
                <div
                    key={image}
                    className={`welcome-background ${
                        index === currentImage ? "active" : ""
                    }`}
                    style={{ backgroundImage: `url("${image}")` }}
                />
            ))}

            <div className="welcome-overlay" />

            <section className="welcome-content">
                <div className="hotel-mark">
                    <div className="hotel-logo">
                        <span className="logo-t">T</span>
                        <span className="logo-m">M</span>
                    </div>
                </div>

                <p className="welcome-subtitle">WELCOME TO</p>

                <h1>Trio Majestica</h1>

                <div className="hotel-title">
                    <span></span>
                    <p>HOTEL</p>
                    <span></span>
                </div>

                <div className="welcome-loading">
                    <div className="loading-header">
                        <p>PREPARING YOUR WORKSPACE</p>
                        <span className="loading-percent">
                            {loadingPercent}%
                        </span>
                    </div>

                    <div className="loading-track">
                        <div
                            className="loading-progress"
                            style={{ "--progress": `${loadingPercent}%` }}
                        ></div>
                    </div>
                </div>
            </section>

            <div className="welcome-bottom">
                <span>EST. 2026</span>
                <span>TRIO MAJESTICA HOTEL</span>
            </div>
        </main>
    );
}

export default WelcomePage;