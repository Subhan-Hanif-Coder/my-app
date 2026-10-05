import orderModel, { reservationModel } from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true" || success === true) {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// User orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    const paginationRequested = ["page", "limit", "search", "status"].some((key) =>
      Object.prototype.hasOwnProperty.call(req.query, key)
    );
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const allowedStatuses = ["Active", "Food Processing", "Out for delivery", "Delivered"];

    if (
      !Number.isInteger(page) || page < 1 ||
      ![10, 20, 50].includes(limit) ||
      search.length > 100 ||
      (status && !allowedStatuses.includes(status))
    ) {
      return res.status(400).json({ success: false, message: "Invalid order list filters." });
    }

    const filter = {};
    if (status === "Active") {
      filter.status = { $ne: "Delivered" };
    } else if (status) {
      filter.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingUsers = await userModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select("_id").lean();
      const searchConditions = [
        { "address.firstName": searchRegex },
        { "address.lastName": searchRegex },
        { "address.phone": searchRegex },
        { "items.name": searchRegex }
      ];
      if (matchingUsers.length) {
        searchConditions.push({ userId: { $in: matchingUsers.map((user) => String(user._id)) } });
      }
      if (mongoose.isValidObjectId(search)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      filter.$or = searchConditions;
    }

    const summaryPromise = orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$amount", 0] } },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Food Processing"] }, 1, 0] } },
          outForDeliveryOrders: { $sum: { $cond: [{ $eq: ["$status", "Out for delivery"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } }
        }
      }
    ]);

    const summaryResult = await summaryPromise;
    const stats = summaryResult[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      outForDeliveryOrders: 0,
      completedOrders: 0
    };
    const total = paginationRequested ? await orderModel.countDocuments(filter) : stats.totalOrders;
    let orderQuery = orderModel.find(filter).sort({ date: -1, _id: -1 });
    if (paginationRequested) {
      orderQuery = orderQuery.skip((page - 1) * limit).limit(limit);
    }
    const orders = await orderQuery.lean();
    const userIds = [...new Set(
      orders.map((order) => order.userId).filter((userId) => mongoose.isValidObjectId(userId))
    )];
    const users = userIds.length
      ? await userModel.find({ _id: { $in: userIds } }).select("name email").lean()
      : [];
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const orderCounts = userIds.length
      ? await orderModel.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", totalOrders: { $sum: 1 } } }
        ])
      : [];
    const orderCountsByUserId = new Map(
      orderCounts.map((entry) => [String(entry._id), entry.totalOrders])
    );

    res.json({
      success: true,
      data: orders.map((order) => {
        const user = usersById.get(String(order.userId));
        const addressName = [order.address?.firstName, order.address?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          ...order,
          customer: {
            name: user?.name || addressName || "Guest customer",
            email: user?.email || "",
            totalOrders: orderCountsByUserId.get(String(order.userId)) || 1
          }
        };
      }),
      ...(paginationRequested && {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats
      })
    });
  } catch (error) {
    console.error("Error listing admin orders", error);
    res.status(500).json({ success: false, message: "We couldn't load orders." });
  }
};

// Api for updating order status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const createReservation = async (req, res) => {
  const { name, email, phone, date, guests, requests = "" } = req.body;
  const parsedDate = new Date(date);
  const guestCount = Number(guests);

  if (
    typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 254 ||
    typeof phone !== "string" || phone.trim().replace(/\D/g, "").length < 7 || phone.trim().length > 30 ||
    !Number.isFinite(parsedDate.getTime()) || parsedDate <= new Date() ||
    !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12 ||
    typeof requests !== "string" || requests.length > 500
  ) {
    return res.status(400).json({ success: false, message: "Please provide valid reservation details. Reservations must be in the future and for 1–12 guests." });
  }

  try {
    const reservation = await reservationModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      date: parsedDate,
      guests: guestCount,
      requests: requests.trim()
    });
    return res.status(201).json({
      success: true,
      message: "Reservation request received. We will confirm it shortly.",
      data: {
        id: reservation._id,
        date: reservation.date,
        guests: reservation.guests,
        status: reservation.status
      }
    });
  } catch (error) {
    console.error("Error creating reservation request", error);
    return res.status(500).json({ success: false, message: "We couldn't save your reservation request. Please try again." });
  }
};

const getReservationStatus = async (req, res) => {
  const { id, email } = req.body;
  if (!mongoose.isValidObjectId(id) || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "Enter a valid booking reference and email address." });
  }

  try {
    const reservation = await reservationModel.findOne({
      _id: id,
      email: email.trim().toLowerCase()
    }).select("date guests status");
    if (!reservation) {
      return res.status(404).json({ success: false, message: "We couldn't find a booking with those details." });
    }
    return res.json({ success: true, data: reservation });
  } catch (error) {
    console.error("Error checking reservation status", error);
    return res.status(500).json({ success: false, message: "We couldn't check this reservation right now." });
  }
};

const listReservations = async (req, res) => {
  try {
    const reservations = await reservationModel.find({}).sort({ date: 1, createdAt: -1 });
    return res.json({ success: true, data: reservations });
  } catch (error) {
    console.error("Error listing reservations", error);
    return res.status(500).json({ success: false, message: "We couldn't load reservations." });
  }
};

const updateReservationStatus = async (req, res) => {
  const { reservationId, status } = req.body;
  const allowedStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"];
  if (!mongoose.isValidObjectId(reservationId) || !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid reservation or status." });
  }

  try {
    const reservation = await reservationModel.findByIdAndUpdate(
      reservationId,
      { status },
      { new: true, runValidators: true }
    );
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found." });
    }
    return res.json({ success: true, data: reservation });
  } catch (error) {
    console.error("Error updating reservation status", error);
    return res.status(500).json({ success: false, message: "We couldn't update this reservation." });
  }
};

export {
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  createReservation,
  getReservationStatus,
  listReservations,
  updateReservationStatus
};
