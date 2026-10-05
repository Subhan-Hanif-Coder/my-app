import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promotionCode: { type: String, default: "" },
    promotionTitle: { type: String, default: "" },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false }
})

orderSchema.index({ date: -1 });
const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

const reservationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    date: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1, max: 12 },
    requests: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
        default: "Pending"
    }
}, { timestamps: true });

const reservationModel = mongoose.models.reservation || mongoose.model("reservation", reservationSchema);

export { reservationModel };
export default orderModel;