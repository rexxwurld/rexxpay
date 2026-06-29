// assets/js/dashboard.js
// Auth guard

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            credentials: "include"
        });

        if (!res.ok) {
            window.location.href = "../auth/login.html";
        }

    } catch (err) {
        window.location.href = "../auth/login.html";
    }
}

checkAuth();

// Load user info
const user = JSON.parse(localStorage.getItem("user"));
if (user) {
    if (document.getElementById("username")) {
        document.getElementById("username").textContent = user.fullname;
    }
    if (document.getElementById("userEmail")) {
        document.getElementById("userEmail").textContent = user.email;
    }
    if (document.getElementById("userAvatar")) {
        document.getElementById("userAvatar").textContent = user.fullname.charAt(0).toUpperCase();
    }
}





async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/wallet`, {
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            if (document.getElementById("balance")) {
                document.getElementById("balance").textContent = data.balance;
            }
            if (document.getElementById("accountNumber")) {
                document.getElementById("accountNumber").textContent = data.accountNumber;
            }
            if (document.getElementById("totalTx")) {
                document.getElementById("totalTx").textContent = data.totalTransactions;
            }
        }
    } catch (err) {
        console.log(err);
    }
}

async function loadRecentActivities() {
    
        const res = await fetch(`${API_BASE}/transaction`, {
            method: "GET",
            credentials: "include"
        });
        const data = await res.json();

        if (!data.success) return;

        const list = document.getElementById("recentList");
        list.innerHTML = "";

        data.transactions.slice(0, 5).forEach(tx => {
            const div = document.createElement("div");
            div.className = "tx-item";
            div.innerHTML = `
                <p><b>${tx.direction.toUpperCase()}</b> - ₦${tx.amount}</p>
                <small>${tx.description || "No description"}</small>
                <hr/>
            `;
            list.appendChild(div);
        });
    
}

loadDashboard();
loadRecentActivities();