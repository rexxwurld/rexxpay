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
// Load wallet data
async function loadWallet() {

    
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
            
        }
   
}

loadWallet();

// Buttons (UI only for now)
const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const transferBtn = document.getElementById("transferBtn");

if (depositBtn) {
    depositBtn.onclick = () => {
        alert("Deposit feature coming soon (Phase 3 backend integration)");
    };
}

if (withdrawBtn) {
    withdrawBtn.onclick = () => {
        alert("Withdraw feature coming soon");
    };
}

if (transferBtn) {
    transferBtn.onclick = () => {
        window.location.href = "transfer.html";
    };
}


async function loadWalletHistory() {

    try {

        const res = await fetch(`${API_BASE}/transaction`, {
    credentials: "include"
});

        const data = await res.json();

        const list = document.getElementById("walletHistory");

        list.innerHTML = "";

        if (!data.transactions || data.transactions.length === 0) {
            list.innerHTML = "<p>No wallet activity yet</p>";
            return;
        }

        data.transactions.forEach(tx => {

            const div = document.createElement("div");

            div.innerHTML = `
                <p>
                    ${tx.direction === "sent" ? "🔴 Sent" : "🟢 Received"} - ₦${tx.amount}
                </p>
                <small>${tx.description || ""}</small>
                <hr/>
            `;

            list.appendChild(div);
        });

    } catch (err) {
        console.log("Wallet activity error:", err);
    }
}



loadWalletHistory();

// ...all your existing code above...

