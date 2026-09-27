import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Alert, Button, IconButton, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import "../styles/Register.css";

const hotelImages = [
    "https://images.unsplash.com/photo-1776361984994-089a9df800f6?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775324537644-ec90f40d7d35?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1759038086397-2b7b1535da04?auto=format&fit=crop&fm=jpg&q=85&w=2400",
];

const API_URL = "http://localhost:5000/api";

function Register() {
    const navigate = useNavigate();

    const [currentImage, setCurrentImage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const imageTimer = setInterval(() => {
            setCurrentImage((previous) => (previous + 1) % hotelImages.length);
        }, 7000);

        return () => clearInterval(imageTimer);
    }, []);

    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const validateForm = () => {
        const newErrors = {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        };

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required.";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required.";
        }

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

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password.";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        return Object.values(newErrors).every((error) => !error);
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

        setServerError("");

        if (name === "password" && formData.confirmPassword && value !== formData.confirmPassword) {
            setErrors((previous) => ({
                ...previous,
                confirmPassword: "Passwords do not match.",
            }));
        }

        if (name === "confirmPassword" && value && formData.password !== value) {
            setErrors((previous) => ({
                ...previous,
                confirmPassword: "Passwords do not match.",
            }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (name === "firstName" && !value.trim()) {
            setErrors((previous) => ({
                ...previous,
                firstName: "First name is required.",
            }));
        }

        if (name === "lastName" && !value.trim()) {
            setErrors((previous) => ({
                ...previous,
                lastName: "Last name is required.",
            }));
        }

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
                    password: "Password must be at least 6 characters.",
                }));
            }

            if (formData.confirmPassword && value !== formData.confirmPassword) {
                setErrors((previous) => ({
                    ...previous,
                    confirmPassword: "Passwords do not match.",
                }));
            }
        }

        if (name === "confirmPassword") {
            if (!value) {
                setErrors((previous) => ({
                    ...previous,
                    confirmPassword: "Please confirm your password.",
                }));
            } else if (value !== formData.password) {
                setErrors((previous) => ({
                    ...previous,
                    confirmPassword: "Passwords do not match.",
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setServerError("");

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            const registrationData = {
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: "admin",
            };

            const response = await axios.post(`${API_URL}/auth/register`, registrationData);

            if (response.data?.success) {
                navigate("/login", {
                    state: {
                        type: "employee",
                        email: registrationData.email,
                        registered: true,
                    },
                });
            }
        } catch (error) {
            console.error("Register error:", error);

            setServerError(error.response?.data?.message || "Unable to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="register-page">
            <section className="register-image">
                {hotelImages.map((image, index) => (
                    <div key={image} className={`register-background ${index === currentImage ? "active" : ""}`} style={{ backgroundImage: `url("${image}")` }} />
                ))}

                <div className="register-image-overlay">
                    <div className="register-brand">
                        <div className="register-logo">
                            <span className="register-logo-t">T</span>
                            <span className="register-logo-m">M</span>
                        </div>

                        <h1>Trio Majestica</h1>

                        <div className="register-brand-title">
                            <span></span>
                            <p>HOTEL</p>
                            <span></span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="register-container container-fluid">
                <div className="register-form-wrapper">
                    <div className="register-form-header">
                        <h2>Create Admin account</h2>
                        <p className="register-description">Create the Admin account to manage the Trio Majestica Hotel Management System.</p>
                    </div>

                    {serverError && <Alert severity="error" className="register-server-alert">{serverError}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="register-form-row row g-4">
                            <div className="register-form-group col-12 col-md-6">
                                <label htmlFor="firstName">FIRST NAME</label>
                                <TextField fullWidth id="firstName" name="firstName" type="text" placeholder="Enter your first name" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.firstName)} helperText={errors.firstName || ""} variant="standard" autoComplete="given-name" />
                            </div>

                            <div className="register-form-group col-12 col-md-6">
                                <label htmlFor="lastName">LAST NAME</label>
                                <TextField fullWidth id="lastName" name="lastName" type="text" placeholder="Enter your last name" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.lastName)} helperText={errors.lastName || ""} variant="standard" autoComplete="family-name" />
                            </div>
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="email">EMAIL ADDRESS</label>
                            <TextField fullWidth id="email" name="email" type="email" placeholder="Enter your Admin email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.email)} helperText={errors.email || ""} variant="standard" autoComplete="email" />
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="password">PASSWORD</label>
                            <TextField fullWidth id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.password)} helperText={errors.password || ""} variant="standard" autoComplete="new-password" InputProps={{ endAdornment: <IconButton type="button" onClick={() => setShowPassword((previous) => !previous)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton> }} />
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                            <TextField fullWidth id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword || ""} variant="standard" autoComplete="new-password" InputProps={{ endAdornment: <IconButton type="button" onClick={() => setShowConfirmPassword((previous) => !previous)} edge="end" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton> }} />
                        </div>

                        <Button fullWidth type="submit" variant="contained" disabled={isLoading} className="register-button">{isLoading ? "Creating Admin Account..." : "Create Admin Account"}</Button>
                    </form>

                    <div className="register-footer">
                        <div className="register-footer-divider">
                            <span></span>
                            <p>EXISTING ACCOUNT?</p>
                            <span></span>
                        </div>

                        <p className="register-switch">Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Register;