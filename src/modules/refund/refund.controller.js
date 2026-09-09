const refundService = require("./refund.service");

async function createRefund(req, res) {
  try {
    const refund = await refundService.createRefund(req.body);

    return res.status(201).json({
      status: true,
      duplicate: false,
      data: {
        submissionRef: refund.reference,
        rejectionReason: null,
      },
    });
  } catch (error) {
    console.error("Create refund error:", error);

    // Idempotency duplicate
    if (error.code === 11000) {
      return res.status(200).json({
        status: true,
        duplicate: true,
        data: {
          submissionRef: null,
          rejectionReason: null,
        },
      });
    }

    return res.status(400).json({
      status: false,
      duplicate: false,
      data: {
        submissionRef: null,
        rejectionReason:
          error.message || "Unable to create refund",
      },
    });
  }
}

async function getRefund(req, res) {
  try {
    const { reference } = req.params;

    const refund = await refundService.getRefundByReference(reference);

    if (!refund) {
      return res.status(404).json({
        status: false,
        data: {
          rejectionReason: "Refund not found",
        },
      });
    }

    return res.status(200).json({
      status: true,
      data: refund,
    });
  } catch (error) {
    console.error("Get refund error:", error);

    return res.status(500).json({
      status: false,
      data: {
        rejectionReason: "Unable to retrieve refund",
      },
    });
  }
}

module.exports = {
  createRefund,
  getRefund,
};
