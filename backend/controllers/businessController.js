import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import { employeeModel, payrollModel } from "../models/payrollModel.js";

const getPeriodRange = (period, dateValue, timezoneOffset = 0) => {
  const localAnchor = dateValue
    ? new Date(`${dateValue}T00:00:00.000Z`)
    : new Date(Date.now() - timezoneOffset * 60 * 1000);
  const anchor = localAnchor;
  if (!Number.isFinite(anchor.getTime())) return null;

  const toUtcBoundary = (year, month, day) =>
    new Date(Date.UTC(year, month, day) + timezoneOffset * 60 * 1000);
  let start;
  let end;
  if (period === "daily") {
    start = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
    end = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() + 1);
  } else if (period === "weekly") {
    const weekdayOffset = (anchor.getUTCDay() + 6) % 7;
    start = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - weekdayOffset);
    end = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - weekdayOffset + 7);
  } else if (period === "monthly") {
    start = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
    end = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1);
  } else {
    start = toUtcBoundary(anchor.getUTCFullYear(), 0, 1);
    end = toUtcBoundary(anchor.getUTCFullYear() + 1, 0, 1);
  }

  let previousStart;
  if (period === "daily") {
    previousStart = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - 1);
  } else if (period === "weekly") {
    const weekdayOffset = (anchor.getUTCDay() + 6) % 7;
    previousStart = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - weekdayOffset - 7);
  } else if (period === "monthly") {
    previousStart = toUtcBoundary(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1);
  } else {
    previousStart = toUtcBoundary(anchor.getUTCFullYear() - 1, 0, 1);
  }

  return {
    start,
    end,
    previousStart,
    previousEnd: start
  };
};

const summarizeOrders = async (start, end) => {
  const [summary] = await orderModel.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        sales: { $sum: { $ifNull: ["$amount", 0] } },
        paidSales: { $sum: { $cond: ["$payment", { $ifNull: ["$amount", 0] }, 0] } },
        paidOrderCount: { $sum: { $cond: ["$payment", 1, 0] } },
        onlinePaymentCount: { $sum: { $cond: [{ $eq: ["$paymentMethod", "online"] }, 1, 0] } },
        cashOnDeliveryCount: { $sum: { $cond: [{ $eq: ["$paymentMethod", "cod"] }, 1, 0] } },
        deliveredCount: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        processingCount: { $sum: { $cond: [{ $eq: ["$status", "Food Processing"] }, 1, 0] } },
        deliveryCount: { $sum: { $cond: [{ $eq: ["$status", "Out for delivery"] }, 1, 0] } },
        unpaidCount: { $sum: { $cond: [{ $ne: ["$payment", true] }, 1, 0] } }
      }
    }
  ]);

  const topItems = await orderModel.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
        sales: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.price", 0] },
              { $ifNull: ["$items.quantity", 0] }
            ]
          }
        }
      }
    },
    { $sort: { quantity: -1, sales: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: "$_id", quantity: 1, sales: 1 } }
  ]);

  return {
    orderCount: summary?.orderCount || 0,
    sales: summary?.sales || 0,
    paidSales: summary?.paidSales || 0,
    paidOrderCount: summary?.paidOrderCount || 0,
    onlinePaymentCount: summary?.onlinePaymentCount || 0,
    cashOnDeliveryCount: summary?.cashOnDeliveryCount || 0,
    deliveredCount: summary?.deliveredCount || 0,
    processingCount: summary?.processingCount || 0,
    deliveryCount: summary?.deliveryCount || 0,
    unpaidCount: summary?.unpaidCount || 0,
    averageOrderValue: summary?.orderCount ? summary.sales / summary.orderCount : 0,
    topItems
  };
};

const buildTrend = async (start, end, period, timezoneOffset) => {
  const format = period === "daily"
    ? "%Y-%m-%dT%H"
    : period === "yearly"
      ? "%Y-%m"
      : "%Y-%m-%d";
  const shiftMilliseconds = -timezoneOffset * 60 * 1000;
  const groupedBuckets = await orderModel.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: { $add: ["$date", shiftMilliseconds] },
            timezone: "UTC"
          }
        },
        orders: { $sum: 1 },
        sales: { $sum: { $ifNull: ["$amount", 0] } },
        paidSales: { $sum: { $cond: ["$payment", { $ifNull: ["$amount", 0] }, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const localStart = new Date(start.getTime() - shiftMilliseconds);
  let keys = [];

  if (period === "daily") {
    keys = Array.from({ length: 24 }, (_, hour) => {
      const bucket = new Date(Date.UTC(
        localStart.getUTCFullYear(),
        localStart.getUTCMonth(),
        localStart.getUTCDate(),
        hour
      ));
      return bucket.toISOString().slice(0, 13);
    });
  } else if (period === "yearly") {
    keys = Array.from({ length: 12 }, (_, month) =>
      new Date(Date.UTC(localStart.getUTCFullYear(), month, 1))
        .toISOString()
        .slice(0, 7)
    );
  } else {
    const bucketCount = period === "weekly"
      ? 7
      : new Date(Date.UTC(
          localStart.getUTCFullYear(),
          localStart.getUTCMonth() + 1,
          0
        )).getUTCDate();

    keys = Array.from({ length: bucketCount }, (_, day) =>
      new Date(Date.UTC(
        localStart.getUTCFullYear(),
        localStart.getUTCMonth(),
        localStart.getUTCDate() + day
      )).toISOString().slice(0, 10)
    );
  }

  const bucketsByKey = new Map(groupedBuckets.map((bucket) => [bucket._id, bucket]));
  return keys.map((key) => {
    const bucket = bucketsByKey.get(key);
    return {
      key,
      orders: bucket?.orders || 0,
      sales: bucket?.sales || 0,
      paidSales: bucket?.paidSales || 0
    };
  });
};

const getBusinessReport = async (req, res) => {
  const { period, date } = req.query;
  const timezoneOffset = req.query.timezoneOffset === undefined ? 0 : Number(req.query.timezoneOffset);
  const validPeriods = ["daily", "weekly", "monthly", "yearly"];
  if (![...validPeriods, "all"].includes(period)) {
    return res.status(400).json({ success: false, message: "Choose a valid report period." });
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, message: "Choose a valid report date." });
  }
  if (!Number.isInteger(timezoneOffset) || timezoneOffset < -720 || timezoneOffset > 840) {
    return res.status(400).json({ success: false, message: "Choose a valid local timezone." });
  }

  const periods = period === "all" ? validPeriods : [period];
  const reports = periods.map((reportPeriod) => ({
    period: reportPeriod,
    range: getPeriodRange(reportPeriod, date, timezoneOffset)
  }));
  const parsedDate = date ? new Date(`${date}T00:00:00.000Z`) : null;
  if (
    reports.some(({ range }) => !range) ||
    (parsedDate && (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date))
  ) {
    return res.status(400).json({ success: false, message: "Choose a valid report date." });
  }

  try {
    const reportData = await Promise.all(reports.map(async ({ period: reportPeriod, range }) => {
      const [current, previous, trend] = await Promise.all([
        summarizeOrders(range.start, range.end),
        summarizeOrders(range.previousStart, range.previousEnd),
        buildTrend(range.start, range.end, reportPeriod, timezoneOffset)
      ]);
      return {
        period: reportPeriod,
        start: range.start,
        end: range.end,
        current,
        previous,
        trend
      };
    }));
    if (period === "all") {
      return res.json({ success: true, data: { period, date: date || null, timezoneOffset, reports: reportData } });
    }
    return res.json({
      success: true,
      data: { ...reportData[0], timezoneOffset }
    });
  } catch (error) {
    console.error("Error creating business report", error);
    return res.status(500).json({ success: false, message: "We couldn't build the business report." });
  }
};

const listEmployees = async (req, res) => {
  const period = req.query.period;
  if (typeof period !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return res.status(400).json({ success: false, message: "Choose a valid payroll month." });
  }
  try {
    const [employees, payroll] = await Promise.all([
      employeeModel.find({}).sort({ active: -1, name: 1 }).lean(),
      payrollModel.find({ period }).populate("employeeId", "name role monthlySalary").sort({ createdAt: -1 }).lean()
    ]);
    return res.json({ success: true, data: employees, payroll });
  } catch (error) {
    console.error("Error listing employees and payroll", error);
    return res.status(500).json({ success: false, message: "We couldn't load staff payroll." });
  }
};

const createEmployee = async (req, res) => {
  const { name, role, phone = "", monthlySalary } = req.body;
  const salary = Number(monthlySalary);
  if (
    typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
    typeof role !== "string" || role.trim().length < 2 || role.trim().length > 80 ||
    typeof phone !== "string" || phone.trim().length > 30 ||
    !Number.isFinite(salary) || salary < 0 || salary > 100000000
  ) {
    return res.status(400).json({ success: false, message: "Enter a valid staff name, role, phone and monthly salary." });
  }

  try {
    const employee = await employeeModel.create({
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      monthlySalary: salary
    });
    return res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error("Error adding employee", error);
    return res.status(500).json({ success: false, message: "We couldn't add this employee." });
  }
};

const savePayroll = async (req, res) => {
  const { employeeId, period, bonus = 0, deductions = 0, advance = 0 } = req.body;
  const amounts = [bonus, deductions, advance].map(Number);
  if (
    !mongoose.isValidObjectId(employeeId) ||
    typeof period !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
    amounts.some((amount) => !Number.isFinite(amount) || amount < 0 || amount > 100000000)
  ) {
    return res.status(400).json({ success: false, message: "Enter valid payroll details for a valid month." });
  }

  try {
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    const [bonusAmount, deductionAmount, advanceAmount] = amounts;
    const netSalary = employee.monthlySalary + bonusAmount - deductionAmount - advanceAmount;
    if (netSalary < 0) {
      return res.status(400).json({ success: false, message: "Bonus, deductions and advance cannot exceed the monthly salary." });
    }
    const payroll = await payrollModel.findOneAndUpdate(
      { employeeId, period },
      {
        $set: {
          baseSalary: employee.monthlySalary,
          bonus: bonusAmount,
          deductions: deductionAmount,
          advance: advanceAmount,
          netSalary,
          paid: false,
          paidAt: null
        },
        $setOnInsert: { employeeId, period }
      },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error saving payroll entry", error);
    return res.status(500).json({ success: false, message: "We couldn't save this payroll entry." });
  }
};

const updatePayrollPaidStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.payrollId) || typeof req.body.paid !== "boolean") {
    return res.status(400).json({ success: false, message: "Provide a valid payroll entry and payment status." });
  }
  try {
    const payroll = await payrollModel.findByIdAndUpdate(
      req.params.payrollId,
      { paid: req.body.paid, paidAt: req.body.paid ? new Date() : null },
      { new: true, runValidators: true }
    );
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll entry not found." });
    }
    return res.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error updating payroll payment status", error);
    return res.status(500).json({ success: false, message: "We couldn't update this salary payment." });
  }
};

export {
  createEmployee,
  getBusinessReport,
  listEmployees,
  savePayroll,
  updatePayrollPaidStatus
};
