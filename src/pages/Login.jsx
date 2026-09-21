import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Login.css";

const hotelImages = [
    "https://images.unsplash.com/photo-1776361984994-089a9df800f6?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775324537644-ec90f40d7d35?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1759038086397-2b7b1535da04?auto=format&fit=crop&fm=jpg&q=85&w=2400",
];

function Login() {
    const navigate = useNavigate();

    const [currentImage, setCurrentImage] = useState(0);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        const imageTimer = setInterval(() => {
            setCurrentImage(
                (previous) => (previous + 1) % hotelImages.length
            );
        }, 7000);

        return () => {
            clearInterval(imageTimer);
        };
    }, []);

    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const validateForm = () => {
        const newErrors = {
            email: "",
            password: "",
        };

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!validateEmail(formData.email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!formData.password) {
            newErrors.password = "Password is required.";
        } else if (formData.password.length < 6) {
            newErrors.password =
                "Password must be at least 6 characters.";
        }

        setErrors(newErrors);

        return !newErrors.email && !newErrors.password;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (name === "email") {
            if (!value.trim()) {
                setErrors((previous) => ({
                    ...previous,
                    email: "Email address is required.",
                }));
            } else if (!validateEmail(value.trim())) {
                setErrors((previous) => ({
                    ...previous,
                    email: "Please enter a valid email address.",
                }));
            }
        }

        if (name === "password") {
            if (!value) {
                setErrors((previous) => ({
                    ...previous,
                    password: "Password is required.",
                }));
            } else if (value.length < 6) {
                setErrors((previous) => ({
                    ...previous,
                    password:
                        "Password must be at least 6 characters.",
                }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        navigate("/dashboard");
    };

    return (
        <main className="login-page">
            <div className="login-image">
                {hotelImages.map((image, index) => (
                    <div
                        key={image}
                        className={`login-background ${
                            index === currentImage ? "active" : ""
                        }`}
                        style={{
                            backgroundImage: `url("${image}")`,
                        }}
                    />
                ))}

                <div className="login-image-overlay">
                    <div className="login-brand">
                        <div className="login-logo">
                            <span className="login-logo-t">T</span>
                            <span className="login-logo-m">M</span>
                        </div>

                        <p className="login-brand-welcome"></p>

                        <h1>Trio Majestica</h1>

                        <div className="login-brand-title">
                            <span></span>
                            <p>HOTEL</p>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-container">
                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <p className="login-welcome">
                            EMPLOYEE PORTAL
                        </p>

                        <h2>Welcome back</h2>

                        <p className="login-description">
                            Sign in with your employee account to access
                            the Trio Majestica Hotel portal.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="login-form-group">
                            <label htmlFor="email">Email Address</label>

                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your employee email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={errors.email ? "input-error" : ""}
                                autoComplete="email"
                            />

                            {errors.email && (
                                <p className="login-error">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="login-form-group">
                            <div className="login-password-label">
                                <label htmlFor="password">Password</label>

                                <button type="button" className="login-forgot-password">
                                    Forgot Password?
                                </button>
                            </div>

                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={errors.password ? "input-error" : ""}
                                autoComplete="current-password"
                            />

                            {errors.password && (
                                <p className="login-error">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="login-footer">
                        <div className="login-footer-divider">
                            <span></span>

                            <p>NEW EMPLOYEE?</p>

                            <span></span>
                        </div>

                        <p className="login-register">
                            Don't have an employee account?
                            <Link to="/register">
                                {" "}
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Login;