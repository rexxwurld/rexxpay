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


let transactionsData = [];

// Fetch transactions
async function loadTransactions() {

    try {
        const res = await fetch(`${API_BASE}/transaction`, {
    credentials: "include"
});

        const data = await res.json();

        if (res.ok) {

            transactionsData = data.transactions;
            renderTransactions(transactionsData);

        }

    } catch (err) {
        console.log(err);
    }
}

// Render table
// Render table
function renderTransactions(data) {
    const table = document.getElementById("txTable");

    if (!table) return;

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No transactions found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(tx => `
        <tr>
            <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
            <td>${new Date(tx.createdAt).toLocaleTimeString()}</td>
            
            <td class="type-${tx.type}">${tx.type}</td>
            <td>₦${Number(tx.amount).toLocaleString()}</td>
            <td><span class="status ${tx.status}">${tx.status}</span></td>
            <td>${tx.description || "N/A"}</td>
            <td>
                <button class="view-btn" onclick="viewReceipt('${tx._id}')">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        </tr>
    `).join("");
}
function viewReceipt(id) {
    const tx = transactionsData.find(t => t._id === id);
    if (!tx) return;

    const modal = document.getElementById("receiptModal");
    const content = document.getElementById("receiptContent");

    
    content.innerHTML = `
    <div class="receipt">
        <h3>Transaction Receipt</h3>
        <hr/>
        <p><b>Date:</b> ${new Date(tx.createdAt).toLocaleDateString()}</p>
        <p><b>Time:</b> ${new Date(tx.createdAt).toLocaleTimeString()}</p>
        <p><b>Type:</b> ${tx.type}</p>
        <p><b>Amount:</b> ₦${Number(tx.amount).toLocaleString()}</p>
        <p><b>Status:</b> ${tx.status}</p>
        <p><b>Description:</b> ${tx.description || "N/A"}</p>
        <p><b>Direction:</b> ${tx.direction}</p>
        <p><b>Sender:</b> ${tx.sender?.fullname || "N/A"}</p>
        <p><b>Receiver:</b> ${tx.receiver?.fullname || "N/A"}</p>
        <p><b>Bank:</b> ${tx.bank || "N/A"}</p>
        <p><b>Account Number:</b> ${tx.accountNumber || "N/A"}</p>
        <p><b>Reference:</b> ${tx._id}</p>
    </div>
`;

    modal.style.display = "flex";
}

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("receiptModal").style.display = "none";
});

// Filters
document.getElementById("typeFilter").addEventListener("change", filterTx);
document.getElementById("statusFilter").addEventListener("change", filterTx);

function filterTx() {

    const type = document.getElementById("typeFilter").value;
    const status = document.getElementById("statusFilter").value;

    let filtered = transactionsData;

    if (type !== "all") {
        filtered = filtered.filter(t => t.type === type);
    }

    if (status !== "all") {
        filtered = filtered.filter(t => t.status === status);
    }

    renderTransactions(filtered);
}


loadTransactions();