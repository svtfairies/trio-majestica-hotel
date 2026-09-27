import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import "../styles/ResetPassword.css";

const API_URL = "http://localhost:5000/api";

function ResetPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetToken, setResetToken] = useState("");

    const [isVerified, setIsVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [otpTimer, setOtpTimer] = useState(0);
    const [otpRequestCount, setOtpRequestCount] = useState(0);
    const [otpResetAt, setOtpResetAt] = useState(null);
    const [isOtpDisabled, setIsOtpDisabled] = useState(false);

    const [errors, setErrors] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
    });

    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const savedEmail = sessionStorage.getItem("resetEmail");

        if (!savedEmail) {
            navigate("/forgot-password");
            return;
        }

        setEmail(savedEmail);
    }, [navigate]);

    useEffect(() => {
        if (otpTimer <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setOtpTimer((previous) => {
                if (previous <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return previous - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [otpTimer]);

    useEffect(() => {
        if (!otpResetAt || !isOtpDisabled) {
            return;
        }

        const checkResetTime = () => {
            const remainingTime = new Date(otpResetAt).getTime() - Date.now();

            if (remainingTime <= 0) {
                setIsOtpDisabled(false);
                setOtpResetAt(null);
                setOtpRequestCount(0);
                setOtpTimer(0);
                setServerError("");
                setSuccess("You can request a new verification code.");
            }
        };

        checkResetTime();

        const timer = setInterval(checkResetTime, 1000);

        return () => clearInterval(timer);
    }, [otpResetAt, isOtpDisabled]);

    const formatOtpTimer = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const updatedDigits = [...otpDigits];

        updatedDigits[index] = digit;

        setOtpDigits(updatedDigits);
        setOtp(updatedDigits.join(""));
        setServerError("");
        setSuccess("");

        setErrors((previous) => ({
            ...previous,
            otp: "",
        }));

        if (digit && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            e.preventDefault();
            document.getElementById(`otp-${index - 1}`)?.focus();
        }

        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            document.getElementById(`otp-${index - 1}`)?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();

        const pastedValue = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedValue) {
            return;
        }

        const updatedDigits = ["", "", "", "", "", ""];

        pastedValue.split("").forEach((digit, index) => {
            updatedDigits[index] = digit;
        });

        setOtpDigits(updatedDigits);
        setOtp(updatedDigits.join(""));
        setServerError("");
        setSuccess("");

        setErrors((previous) => ({
            ...previous,
            otp: "",
        }));

        const nextIndex = Math.min(pastedValue.length, 5);

        document.getElementById(`otp-${nextIndex}`)?.focus();
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setServerError("");
        setSuccess("");

        setErrors((previous) => ({
            ...previous,
            password: "",
        }));
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        setServerError("");
        setSuccess("");

        setErrors((previous) => ({
            ...previous,
            confirmPassword: "",
        }));
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        setServerError("");
        setSuccess("");

        if (!otp.trim()) {
            setErrors((previous) => ({
                ...previous,
                otp: "Verification code is required.",
            }));
            return;
        }

        if (!/^\d{6}$/.test(otp.trim())) {
            setErrors((previous) => ({
                ...previous,
                otp: "Verification code must contain exactly 6 digits.",
            }));
            return;
        }

        try {
            setIsLoading(true);

            const response = await axios.post(`${API_URL}/otp/verify`, {
                email,
                otp: otp.trim(),
                purpose: "forgot-password",
            });

            if (!response.data?.success) {
                setServerError(response.data?.message || "Invalid verification code.");
                return;
            }

            const receivedResetToken = response.data?.resetToken;

            if (!receivedResetToken) {
                setServerError("Unable to create a secure password reset session. Please request a new OTP.");
                return;
            }

            setResetToken(receivedResetToken);
            setIsVerified(true);
            setOtpTimer(0);
            setSuccess("Verification code confirmed. You can now create a new password.");

            setErrors({
                otp: "",
                password: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("OTP verification error:", error);

            setServerError(
                error.response?.data?.message ||
                    "Unable to verify the code. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        setServerError("");
        setSuccess("");

        const newErrors = {
            otp: "",
            password: "",
            confirmPassword: "",
        };

        if (!resetToken) {
            setServerError("Your password reset session is invalid. Please request a new OTP.");
            return;
        }

        if (!password) {
            newErrors.password = "New password is required.";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        if (Object.values(newErrors).some((error) => error)) {
            return;
        }

        try {
            setIsLoading(true);

            const response = await axios.post(
                `${API_URL}/auth/reset-password`,
                {
                    email,
                    password,
                    resetToken,
                }
            );

            if (!response.data?.success) {
                setServerError(
                    response.data?.message || "Unable to reset your password."
                );
                return;
            }

            setSuccess("Your password has been reset successfully.");
            setResetToken("");
            sessionStorage.removeItem("resetEmail");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Reset password error:", error);

            setServerError(
                error.response?.data?.message || "Unable to reset your password. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (otpTimer > 0 || isOtpDisabled || isResending) {
            return;
        }

        setServerError("");
        setSuccess("");

        try {
            setIsResending(true);

            const response = await axios.post(`${API_URL}/otp/resend`, {
                email,
                purpose: "forgot-password",
            });

            const data = response.data;

            setSuccess(
                data?.message || "A new verification code has been sent."
            );

            setOtp("");
            setOtpDigits(["", "", "", "", "", ""]);

            setErrors((previous) => ({
                ...previous,
                otp: "",
            }));

            if (data?.resendCooldownSeconds) {
                setOtpTimer(Number(data.resendCooldownSeconds));
            }

            if (data?.requestCount) {
                setOtpRequestCount(Number(data.requestCount));
            }

            if (data?.isLastRequest) {
                setIsOtpDisabled(true);
                setOtpResetAt(data?.resetAt || null);
            }

            setTimeout(() => {
                document.getElementById("otp-0")?.focus();
            }, 50);
        } catch (error) {
            console.error("Resend OTP error:", error);

            setServerError(
                error.response?.data?.message || "Unable to resend the verification code."
            );
        } finally {
            setIsResending(false);
        }
    };

    return (
        <main className="reset-password-page">
            <div className="reset-password-card">
                <div className="reset-password-brand">
                    <div className="reset-password-logo">
                        <span className="reset-password-logo-t">T</span>
                        <span className="reset-password-logo-m">M</span>
                    </div>

                    <h1>Trio Majestica</h1>

                    <div className="reset-password-brand-title">
                        <span></span>
                        <p>HOTEL</p>
                        <span></span>
                    </div>
                </div>

                <div className="reset-password-content">
                    {!isVerified ? (
                        <>
                            <h2>Verification Code</h2>

                            <p className="reset-password-description">Enter the 6-digit verification code sent to your email address to continue.</p>

                            {serverError && <p className="reset-password-error">{serverError}</p>}

                            {success && <p className="reset-password-success">{success}</p>}

                            <form onSubmit={handleVerifyOTP} noValidate>
                                <div className="reset-password-otp-group">
                                    <label>VERIFICATION CODE</label>

                                    <div className="reset-password-otp-boxes">
                                        {otpDigits.map((digit, index) => (
                                            <input key={index} id={`otp-${index}`} type="text" inputMode="numeric" maxLength="1" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} autoComplete={index === 0 ? "one-time-code" : "off"} autoFocus={index === 0} aria-label={`Verification code digit ${index + 1}`} />
                                        ))}
                                    </div>

                                    {errors.otp && <p className="reset-password-field-error">{errors.otp}</p>}
                                </div>

                                <button type="submit" className="reset-password-button" disabled={isLoading}>{isLoading ? "Verifying..." : "Verify Code"}</button>
                            </form>

                            <button type="button" className="reset-password-resend" onClick={handleResend} disabled={isResending || otpTimer > 0 || isOtpDisabled}>{isResending ? "Sending..." : isOtpDisabled ? "No More OTP Requests" : "Resend Verification Code"}</button>

                            {otpTimer > 0 && !isOtpDisabled && <p className="reset-password-otp-timer">You can request another code in {formatOtpTimer(otpTimer)}.</p>}

                            {isOtpDisabled && <p className="reset-password-otp-limit">You have reached the maximum of 3 OTP requests.</p>}
                        </>
                    ) : (
                        <>
                            <h2>Create new password</h2>

                            <p className="reset-password-description">Your email has been verified. Create a new password for your account.</p>

                            {serverError && <p className="reset-password-error">{serverError}</p>}

                            {success && <p className="reset-password-success">{success}</p>}

                            <form onSubmit={handleResetPassword} noValidate>
                                <div className="reset-password-form-group">
                                    <label htmlFor="password">NEW PASSWORD</label>

                                    <div className="reset-password-input-wrapper">
                                        <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="Create a new password" value={password} onChange={handlePasswordChange} autoComplete="new-password" autoFocus />

                                        <IconButton type="button" onClick={() => setShowPassword((previous) => !previous)} className="reset-password-visibility" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                    </div>

                                    {errors.password && <p className="reset-password-field-error">{errors.password}</p>}
                                </div>

                                <div className="reset-password-form-group">
                                    <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>

                                    <div className="reset-password-input-wrapper">
                                        <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" placeholder="Confirm your new password" value={confirmPassword} onChange={handleConfirmPasswordChange} autoComplete="new-password" />

                                        <IconButton type="button" onClick={() => setShowConfirmPassword((previous) => !previous)} className="reset-password-visibility" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                    </div>

                                    {errors.confirmPassword && <p className="reset-password-field-error">{errors.confirmPassword}</p>}
                                </div>

                                <button type="submit" className="reset-password-button" disabled={isLoading}>{isLoading ? "Resetting Password..." : "Reset Password"}</button>
                            </form>
                        </>
                    )}

                    <div className="reset-password-footer">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ResetPassword;