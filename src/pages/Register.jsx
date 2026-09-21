import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Register.css";

const hotelImages = [
    "https://images.unsplash.com/photo-1776361984994-089a9df800f6?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1775324537644-ec90f40d7d35?auto=format&fit=crop&fm=jpg&q=85&w=2400",
    "https://images.unsplash.com/photo-1759038086397-2b7b1535da04?auto=format&fit=crop&fm=jpg&q=85&w=2400",
];

function Register() {
    const navigate = useNavigate();

    const [currentImage, setCurrentImage] = useState(0);

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
            newErrors.password =
                "Password must be at least 6 characters.";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password.";
        } else if (
            formData.password !== formData.confirmPassword
        ) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        return Object.values(newErrors).every(
            (error) => !error
        );
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

        if (
            name === "password" &&
            formData.confirmPassword &&
            value !== formData.confirmPassword
        ) {
            setErrors((previous) => ({
                ...previous,
                confirmPassword: "Passwords do not match.",
            }));
        }

        if (
            name === "confirmPassword" &&
            value &&
            formData.password !== value
        ) {
            setErrors((previous) => ({
                ...previous,
                confirmPassword: "Passwords do not match.",
            }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (name === "firstName") {
            if (!value.trim()) {
                setErrors((previous) => ({
                    ...previous,
                    firstName: "First name is required.",
                }));
            }
        }

        if (name === "lastName") {
            if (!value.trim()) {
                setErrors((previous) => ({
                    ...previous,
                    lastName: "Last name is required.",
                }));
            }
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

            if (
                formData.confirmPassword &&
                value !== formData.confirmPassword
            ) {
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        console.log("Register:", formData);

        navigate("/login");
    };

    return (
        <main className="register-page">
            <div className="register-image">
                {hotelImages.map((image, index) => (
                    <div
                        key={image}
                        className={`register-background ${
                            index === currentImage ? "active" : ""
                        }`}
                        style={{
                            backgroundImage: `url("${image}")`,
                        }}
                    />
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
            </div>

            <div className="register-container">
                <div className="register-form-wrapper">
                    <div className="register-form-header">
                        <p className="register-welcome">
                            EMPLOYEE REGISTRATION
                        </p>

                        <h2>Create your account</h2>

                        <p className="register-description">
                            Create your employee account to access
                            the Trio Majestica Hotel portal.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="register-form-row">
                            <div className="register-form-group">
                                <label htmlFor="firstName">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Enter your first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={errors.firstName ? "input-error" : ""}
                                    autoComplete="given-name"
                                />

                                {errors.firstName && (
                                    <p className="register-error">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>

                            <div className="register-form-group">
                                <label htmlFor="lastName">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Enter your last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={errors.lastName ? "input-error" : ""}
                                    autoComplete="family-name"
                                />

                                {errors.lastName && (
                                    <p className="register-error">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

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
                                <p className="register-error">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="password">Password</label>

                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={
                                    errors.password
                                        ? "input-error"
                                        : ""
                                }
                                autoComplete="new-password"
                            />

                            {errors.password && (
                                <p className="register-error">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={
                                    errors.confirmPassword
                                        ? "input-error"
                                        : ""
                                }
                                autoComplete="new-password"
                            />

                            {errors.confirmPassword && (
                                <p className="register-error">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="register-button"
                        >
                            Create Account
                        </button>
                    </form>

                    <div className="register-footer">
                        <div className="register-footer-divider">
                            <span></span>
                            <p>EXISTING EMPLOYEE?</p>
                            <span></span>
                        </div>

                        <p className="register-switch">
                            Already have an account?
                            <Link to="/login"> {" "} Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Register;