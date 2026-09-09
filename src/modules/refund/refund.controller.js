const refundService = require("./refund.service");

async function createRefund(req, res) {
  try {
    const refund = await refundService.createRefund(req.body);

    return res.status(201).json({
      success: true,
      message: "Refund created successfully",
      data: refund,
    });
  } catch (error) {
    console.error("Create refund error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Refund with this idempotency key already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create refund",
    });
  }
}

async function getRefund(req, res) {
  try {
    const { reference } = req.params;

    const refund = await refundService.getRefundByReference(reference);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: refund,
    });
  } catch (error) {
    console.error("Get refund error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve refund",
    });
  }
}

async function processRefund(req, res) {
  try {
    const { reference } = req.params;

    const refund = await refundService.processRefund(reference);

    return res.status(200).json({
      success: true,
      message: "Refund is processing",
      data: refund,
    });
  } catch (error) {
    console.error("Process refund error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to process refund",
    });
  }
}

async function markRefundSuccessful(req, res) {
  try {
    const { reference } = req.params;
    const { providerRef } = req.body;

    const refund = await refundService.markRefundSuccessful(
      reference,
      providerRef
    );

    return res.status(200).json({
      success: true,
      message: "Refund marked as successful",
      data: refund,
    });
  } catch (error) {
    console.error("Mark refund successful error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update refund",
    });
  }
}

async function markRefundFailed(req, res) {
  try {
    const { reference } = req.params;
    const { reason } = req.body;

    const refund = await refundService.markRefundFailed(
      reference,
      reason
    );

    return res.status(200).json({
      success: true,
      message: "Refund marked as failed",
      data: refund,
    });
  } catch (error) {
    console.error("Mark refund failed error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update refund",
    });
  }
}

async function markRefundReversed(req, res) {
  try {
    const { reference } = req.params;
    const { reason } = req.body;

    const refund = await refundService.markRefundReversed(
      reference,
      reason
    );

    return res.status(200).json({
      success: true,
      message: "Refund marked as reversed",
      data: refund,
    });
  } catch (error) {
    console.error("Mark refund reversed error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update refund",
    });
  }
}

module.exports = {
  createRefund,
  getRefund,
  processRefund,
  markRefundSuccessful,
  markRefundFailed,
  markRefundReversed,
};
