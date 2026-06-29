
const API_BASE = "https://rexxpay.onrender.com/api/v1";// 🔥 change to localhost for testing


async function apiRequest(endpoint, method = "GET", body = null) {

    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include" 
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "API Error");
    }

    return data;
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        localStorage.removeItem("user");
        window.location.href = "../auth/login.html";

    } catch (err) {
        console.error(err);
        alert("Logout failed");
    }
}


const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}