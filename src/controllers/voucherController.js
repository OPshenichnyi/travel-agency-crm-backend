import Order from "../models/order.js";
import PDFService from "../services/pdfService.js";
import logger from "../utils/logger.js";

export const generateVoucherController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Log the request
    logger.info(
      `Voucher generation requested for order ${orderId} by user ${userId} (${userRole})`
    );

    // Find the order
    const order = await Order.findByPk(orderId);

    if (!order) {
      logger.warn(`Order ${orderId} not found for voucher generation`);
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Check if user has permission to access this order
    // Agents can only access their own orders, managers and admins can access all
    if (userRole === "agent" && order.agentId !== userId) {
      logger.warn(
        `User ${userId} attempted to access order ${orderId} without permission`
      );
      return res.status(403).json({
        error:
          "Access denied. You can only generate vouchers for your own orders.",
      });
    }

    // Check if order status is approved
    if (order.statusOrder !== "approved") {
      logger.warn(
        `Voucher generation attempted for order ${orderId} with status ${order.statusOrder}`
      );
      return res.status(403).json({
        error: "Voucher generation requires manager approval",
      });
    }

    // Validate required fields
    const requiredFields = [
      "checkIn",
      "checkOut",
      "nights",
      "propertyName",
      "cityTravel",
      "countryTravel",
      "reservationNumber",
      "clientName",
      "officialPrice",
      "totalPrice",
    ];

    const missingFields = requiredFields.filter((field) => !order[field]);

    if (missingFields.length > 0) {
      logger.error(
        `Missing required fields for voucher generation: ${missingFields.join(
          ", "
        )}`
      );
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Generate PDF
    const pdfBuffer = await PDFService.generateVoucher(order);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="voucher-${order.reservationNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

    logger.info(`Voucher generated successfully for order ${orderId}`);
  } catch (error) {
    logger.error(
      `Error generating voucher for order ${req.params.orderId}:`,
      error
    );
    res.status(500).json({
      error: "Error generating PDF voucher",
    });
  }
};
