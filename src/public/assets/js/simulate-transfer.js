const form = document.getElementById('simulateForm');
const button = document.getElementById('payButton');
const statusBox = document.getElementById('status');

function showSuccess(message) {
  statusBox.className = 'status success';
  statusBox.textContent = message;
}

function showError(message) {
  statusBox.className = 'status error';
  statusBox.textContent = '❌ ' + message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const accountNumber = document.getElementById('accountNumber').value.trim();
  const amount = Number(document.getElementById('amount').value);

  statusBox.className = 'status';
  statusBox.textContent = '';

  if (!accountNumber) {
    showError('Enter the wallet account number.');
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showError('Enter a valid amount.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Processing...';

  try {
    const response = await fetch('/api/v1/mock-bank/simulate-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber, amount, currency: 'NGN' }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned HTTP ${response.status}.`);
    }

    if (!response.ok || !data.status) {
      throw new Error(data.message || `Simulation failed (HTTP ${response.status}).`);
    }

    if (data.duplicate) {
      showSuccess(`⚠️ Duplicate reference — original deposit already processed.\n\nDeposit ID: ${data.data._id}`);
    } else {
      showSuccess(
        `✅ Deposit processed.\n\n` +
        `Amount: ₦${amount}\n` +
        `Deposit ID: ${data.data._id}\n\n` +
        `If this wallet is SwiftPay-linked, a webhook was sent to SwiftPay — check its Transaction/WebhookEvent records to confirm it landed.`
      );
    }

  } catch (error) {
    showError(error.message || 'Unable to simulate payment.');
  } finally {
    button.disabled = false;
    button.textContent = 'Simulate Payment';
  }
});
