import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 180 },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0.01 },
    applicationType: { type: String, enum: ["automatic", "code"], required: true },
    code: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const promotionModel =
  mongoose.models.promotion || mongoose.model("promotion", promotionSchema);

export default promotionModel;
