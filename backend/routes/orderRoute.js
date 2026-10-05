import express from "express"
import authMiddleware from "../middleware/auth.js"
import { timingSafeEqual } from "crypto";
import {
  createReservation,
  getReservationStatus,
  listOrders,
  listReservations,
  updateReservationStatus,
  updateStatus,
  userOrders,
  verifyOrder
} from "../controllers/orderController.js"
import {
  createPromotion,
  listActivePromotions,
  listPromotions,
  placeDiscountedOrder,
  quotePromotion,
  updatePromotion
} from "../controllers/promotionController.js";
import {
  createEmployee,
  getBusinessReport,
  listEmployees,
  savePayroll,
  updatePayrollPaidStatus
} from "../controllers/businessController.js"

const orderRouter = express.Router();

const requireAdminKey = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;
  const suppliedKey = req.get("x-admin-key");
  if (!configuredKey) {
    return res.status(503).json({ success: false, message: "Admin access is not configured on the server." });
  }
  const configuredBuffer = Buffer.from(configuredKey);
  const suppliedBuffer = typeof suppliedKey === "string" ? Buffer.from(suppliedKey) : null;
  if (
    !suppliedBuffer ||
    suppliedBuffer.length !== configuredBuffer.length ||
    !timingSafeEqual(suppliedBuffer, configuredBuffer)
  ) {
    return res.status(401).json({ success: false, message: "Admin authorization failed." });
  }
  return next();
};

orderRouter.post("/reservation/request", createReservation);
orderRouter.post("/reservation/status", getReservationStatus);
orderRouter.post("/reservation/admin/login", requireAdminKey, (req, res) => {
  res.json({ success: true });
});
orderRouter.get("/reservation/admin/list", requireAdminKey, listReservations);
orderRouter.post("/reservation/admin/status", requireAdminKey, updateReservationStatus);
orderRouter.get("/admin/business-report", requireAdminKey, getBusinessReport);
orderRouter.get("/admin/employees", requireAdminKey, listEmployees);
orderRouter.post("/admin/employees", requireAdminKey, createEmployee);
orderRouter.post("/admin/payroll", requireAdminKey, savePayroll);
orderRouter.patch("/admin/payroll/:payrollId/payment", requireAdminKey, updatePayrollPaidStatus);
orderRouter.get("/promotions/active", listActivePromotions);
orderRouter.post("/promotions/quote", quotePromotion);
orderRouter.get("/admin/promotions", requireAdminKey, listPromotions);
orderRouter.post("/admin/promotions", requireAdminKey, createPromotion);
orderRouter.patch("/admin/promotions/:promotionId", requireAdminKey, updatePromotion);

orderRouter.post("/place", authMiddleware, placeDiscountedOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateStatus);

export default orderRouter;