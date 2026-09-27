import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import axios from "axios";
import "../styles/ForgotPassword.css";

const API_URL = "http://localhost:5000/api";

function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (value) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(value);
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Email address is required.");
            return;
        }

        if (!validateEmail(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await axios.post(`${API_URL}/otp/send`, {
                email: normalizedEmail,
                purpose: "forgot-password",
            });

            setSuccess(response.data?.message || "A verification code has been sent to your email address.");

            sessionStorage.setItem("resetEmail", normalizedEmail);

            setTimeout(() => {
                navigate("/reset-password");
            }, 1200);
        } catch (error) {
            console.error("Forgot password error:", error);

            setError(error.response?.data?.message || "Unable to send the verification code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="forgot-password-page container-fluid">
            <div className="forgot-password-card">
                <div className="forgot-password-brand">
                    <div className="forgot-password-logo">
                        <span className="forgot-password-logo-t">T</span>
                        <span className="forgot-password-logo-m">M</span>
                    </div>

                    <h1>Trio Majestica</h1>

                    <div className="forgot-password-brand-title">
                        <span></span>
                        <p>HOTEL</p>
                        <span></span>
                    </div>
                </div>

                <div className="forgot-password-content">
                    <div className="forgot-password-heading">
                        <h2>Forgot your password?</h2>
                        <p>Enter your email address and we will send you a verification code to continue.</p>
                    </div>

                    {error && <Alert severity="error" className="forgot-password-alert">{error}</Alert>}

                    {success && <Alert severity="success" className="forgot-password-alert">{success}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="forgot-password-form-group">
                            <label htmlFor="email">EMAIL ADDRESS</label>
                            <TextField fullWidth id="email" name="email" type="email" placeholder="Enter your email address" value={email} onChange={handleChange} error={Boolean(error)} helperText={error || ""} variant="standard" autoComplete="email" />
                        </div>

                        <Button fullWidth type="submit" variant="contained" disabled={isLoading} className="forgot-password-button">{isLoading ? "Sending..." : "Continue"}</Button>
                    </form>

                    <div className="forgot-password-footer">
                        <span>Remember your password?</span>
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ForgotPassword;