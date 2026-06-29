
// ===============================
// Toggle Password Visibility
// ===============================

const togglePassword = document.querySelector(".toggle-password");

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const password = document.getElementById("password");

        const icon = togglePassword.querySelector("i");

        if (password.type === "password") {

            password.type = "text";

            icon.classList.remove("bi-eye");

            icon.classList.add("bi-eye-slash");

        } else {

            password.type = "password";

            icon.classList.remove("bi-eye-slash");

            icon.classList.add("bi-eye");

        }

    });

}

// ===============================
// Login Form
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {

            const response = await fetch(`${API_BASE}/auth/login`, {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include", // 🔥 IMPORTANT FOR COOKIES

                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();
         


            if (response.ok) {

                // ❌ REMOVE localStorage token

                localStorage.setItem("user", JSON.stringify(data.user));

                alert("Login successful.");

                window.location.href = "../dashboard/dashboard.html";

            } else {
                alert(data.message || "Login failed.");
            }

        } catch (error) {
            console.error(error);
            alert("Unable to connect to the server.");
        }

    });
}

// ===============================
// Register Form
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const fullname = document.getElementById("fullname").value.trim();

        const email = document.getElementById("email").value.trim();

        const phone = document.getElementById("phone").value.trim();

        const password = document.getElementById("password").value.trim();

        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        if (!fullname || !email || !phone || !password || !confirmPassword) {

            alert("Please fill in all fields.");

            return;

        }

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/auth/register`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    fullname,

                    email,

                    phone,

                    password

                })

            });

            const data = await response.json();

            if (response.ok) {

                alert("Registration successful. Verify your OTP.");

                window.location.href = "verify-otp.html";

            } else {

                alert(data.message || "Registration failed.");

            }

        } catch (error) {

            console.error(error);

            alert("Unable to connect to the server.");

        }

    });

}


// ===============================
// Forgot Password Form
// ===============================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email) {

            alert("Please enter your email address.");

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/auth/forgot-password`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email

                })

            });

            const data = await response.json();

            if (response.ok) {

                alert("OTP sent successfully.");

                localStorage.setItem("resetEmail", email);

                window.location.href = "verify-otp.html";

            } else {

                alert(data.message || "Unable to send OTP.");

            }

        } catch (error) {

            console.error(error);

            alert("Unable to connect to the server.");

        }

    });

}


// ===============================
// OTP Verification + Resend OTP
// ===============================

const otpForm = document.getElementById("otpForm");

if (otpForm) {

    otpForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const otp = document.getElementById("otp").value.trim();

        const email = localStorage.getItem("resetEmail") || "";

        if (!otp) {

            alert("Please enter OTP.");

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/auth/verify-otp`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,
                    otp

                })

            });

            const data = await response.json();

            if (response.ok) {

                alert("OTP verified successfully.");

                localStorage.setItem("verifiedEmail", email);

                window.location.href = "reset-password.html";

            } else {

                alert(data.message || "Invalid OTP.");

            }

        } catch (error) {

            console.error(error);

            alert("Server error. Try again later.");

        }

    });

}

// ===============================
// Resend OTP
// ===============================

const resendOtp = document.getElementById("resendOtp");

if (resendOtp) {

    resendOtp.addEventListener("click", async (e) => {

        e.preventDefault();

        const email = localStorage.getItem("resetEmail");

        if (!email) {

            alert("No email found. Restart process.");

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/auth/resend-otp`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({ email })

            });

            const data = await response.json();

            if (response.ok) {

                alert("OTP resent successfully.");

            } else {

                alert(data.message || "Failed to resend OTP.");

            }

        } catch (error) {

            console.error(error);

            alert("Server error. Try again later.");

        }

    });

}



// ===============================
// Reset Password Form
// ===============================

const resetPasswordForm = document.getElementById("resetPasswordForm");

if (resetPasswordForm) {

    resetPasswordForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const newPassword = document.getElementById("newPassword").value.trim();

        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        const email = localStorage.getItem("verifiedEmail");

        if (!newPassword || !confirmPassword) {

            alert("Please fill in all fields.");

            return;

        }

        if (newPassword !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }

        if (!email) {

            alert("Session expired. Restart process.");

            window.location.href = "forgot-password.html";

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/auth/reset-password`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,
                    newPassword

                })

            });

            const data = await response.json();

            if (response.ok) {

                alert("Password reset successful.");

                localStorage.removeItem("resetEmail");
                localStorage.removeItem("verifiedEmail");

                window.location.href = "login.html";

            } else {

                alert(data.message || "Reset failed.");

            }

        } catch (error) {

            console.error(error);

            alert("Server error. Try again later.");

        }

    });

}

