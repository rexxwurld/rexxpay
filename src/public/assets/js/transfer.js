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

// Helper functions
function showError(msg) {
    const el = document.getElementById("transferMsg");
    el.style.display = "block";
    el.style.background = "#ffe5e5";
    el.style.color = "#cc0000";
    el.style.border = "1px solid #ffcccc";
    el.innerHTML = `<i class="bi bi-x-circle"></i> ${msg}`;
}

function showSuccess(msg) {
    const el = document.getElementById("transferMsg");
    el.style.display = "block";
    el.style.background = "#e5fff0";
    el.style.color = "#007a33";
    el.style.border = "1px solid #b3ffd6";
    el.innerHTML = `<i class="bi bi-check-circle"></i> ${msg}`;
}

// Load user
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

// Transfer Form
const transferForm = document.getElementById("transferForm");
if (transferForm) {
    transferForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const accountNumber = document.getElementById("accountNumber").value.trim();
        const bank = document.getElementById("bank").value.trim();
        const amount = document.getElementById("amount").value.trim();
        const description = document.getElementById("description").value.trim();

        if (!accountNumber || !bank || !amount) {
            showError("Please fill all required fields");
            return;
        }

        
            const res = await fetch(`${API_BASE}/transaction/transfer`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountNumber, bank, amount, description })
            });

            const data = await res.json();

            if (res.ok) {
                showSuccess("Transfer successful! Redirecting...");
                setTimeout(() => {
                    window.location.href = "transactions.html";
                }, 2000);
            } else {
                showError(data.message || "Transfer failed");
            }

        
    });
}