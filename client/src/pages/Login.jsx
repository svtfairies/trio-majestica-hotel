
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Alert, Button, IconButton, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import "../styles/Login.css";

const hotelImages = [
    "https://images.unsplash.com/photo-1776361984994-089a9df800f6?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775324537644-ec90f40d7d35?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1759038086397-2b7b1535da04?auto=format&fit=crop&fm=jpg&q=85&w=2400"
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentImage, setCurrentImage] = useState(0);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [serverError, setServerError] = useState("");
    const [serverSuccess, setServerSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const imageTimer = setInterval(() => {
            setCurrentImage((previous) => (previous + 1) % hotelImages.length);
        }, 7000);

        return () => clearInterval(imageTimer);
    }, []);

    useEffect(() => {
        const registeredEmail = location.state?.email;
        const registered = location.state?.registered;

        if (registeredEmail) {
            setFormData((previous) => ({
                ...previous,
                email: registeredEmail.toLowerCase()
            }));
        }

        if (registered) {
            setServerError("");
            setServerSuccess("Your receptionist account has been created successfully. You may now sign in.");
        }
    }, [location.state]);

    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const validateForm = () => {
        const newErrors = { email: "", password: "" };

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!validateEmail(formData.email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!formData.password) {
            newErrors.password = "Password is required.";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }

        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setServerError("");
        setServerSuccess("");
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;

        if (name === "email") {
            if (!value.trim()) {
                setErrors((previous) => ({
                    ...previous,
                    email: "Email address is required."
                }));
            } else if (!validateEmail(value.trim())) {
                setErrors((previous) => ({
                    ...previous,
                    email: "Please enter a valid email address."
                }));
            }
        }

        if (name === "password") {
            if (!value) {
                setErrors((previous) => ({
                    ...previous,
                    password: "Password is required."
                }));
            } else if (value.length < 6) {
                setErrors((previous) => ({
                    ...previous,
                    password: "Password must be at least 6 characters."
                }));
            }
        }
    };

    const handleForgotPassword = () => {
        navigate("/forgot-password");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setServerError("");
        setServerSuccess("");

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            const response = await axios.post(`${API_URL}/auth/login`, {
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            const { token, user } = response.data;

            if (!token || !user) {
                setServerError("Invalid login response from the server.");
                return;
            }

            if (user.role !== "receptionist") {
                setServerError("Only receptionist accounts can access this system.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/receptionist/dashboard", { replace: true });
        } catch (error) {
            console.error("Login error:", error);

            if (error.response) {
                setServerError(error.response.data?.message || "Invalid email or password.");
            } else if (error.request) {
                setServerError("Unable to connect to the server. Please make sure the backend is running.");
            } else {
                setServerError("Unable to process your login request. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-image">
                {hotelImages.map((image, index) => (
                    <div key={image} className={`login-background ${index === currentImage ? "active" : ""}`} style={{ backgroundImage: `url("${image}")` }} />
                ))}
                <div className="login-image-overlay">
                    <div className="login-brand">
                        <div className="login-logo">
                            <span className="login-logo-t">T</span>
                            <span className="login-logo-m">M</span>
                        </div>
                        <p className="login-brand-welcome">WELCOME TO</p>
                        <h1>Trio Majestica</h1>
                        <div className="login-brand-title">
                            <span></span>
                            <p>HOTEL</p>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-container container-fluid">
                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <h2>Welcome back</h2>
                        <p className="login-description">Sign in to access your Trio Majestica Hotel receptionist account.</p>
                    </div>

                    {serverError && <Alert severity="error" className="login-server-alert">{serverError}</Alert>}
                    {serverSuccess && <Alert severity="success" className="login-server-alert">{serverSuccess}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="login-form-group">
                            <label htmlFor="email">Email Address</label>
                            <TextField fullWidth id="email" name="email" type="email" placeholder="Enter your email address" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.email)} helperText={errors.email || ""} variant="standard" autoComplete="email" />
                        </div>

                        <div className="login-form-group">
                            <div className="login-password-label">
                                <label htmlFor="password">Password</label>
                                <button type="button" className="login-forgot-password" onClick={handleForgotPassword}>Forgot Password?</button>
                            </div>
                            <TextField fullWidth id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.password)} helperText={errors.password || ""} variant="standard" autoComplete="current-password" slotProps={{ input: { endAdornment: <IconButton type="button" onClick={() => setShowPassword((previous) => !previous)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton> }}} />
                        </div>

                        <Button fullWidth type="submit" variant="contained" disabled={isLoading} className="login-button">{isLoading ? "Signing In..." : "Sign In"}</Button>
                    </form>

                    <div className="login-footer">
                        <div className="login-footer-divider">
                            <span></span>
                            <p>RECEPTIONIST REGISTRATION</p>
                            <span></span>
                        </div>
                        <p className="login-register">Don't have a account yet? <Link to="/register">Register Now</Link></p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Login;