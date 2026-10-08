import mongoose from "mongoose";
import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import promotionModel from "../models/promotionModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import {
  sendAdminOrderNotification,
  sendPromotionAnnouncement,
  sendOrderPlacedNotification,
} from "../utils/sendCustomerNotification.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const DELIVERY_FEE_CENTS = 200;

// ======================================================
// FRONTEND URL
// ======================================================

const frontendUrl =
  process.env.FRONTEND_URL ||
  "https://my-app-7xrc.vercel.app";

// ======================================================
// ACTIVE PROMOTIONS
// ======================================================

const getActivePromotions = (now = new Date()) =>
  promotionModel
    .find({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    })
    .sort({ startsAt: -1 })
    .lean();

const toPublicPromotion = (promotion) => ({
  _id: promotion._id,
  title: promotion.title,
  message: promotion.message,
  discountType: promotion.discountType,
  discountValue: promotion.discountValue,
  applicationType: promotion.applicationType,
  ...(promotion.applicationType === "code" && {
    code: promotion.code,
  }),
  minimumOrderAmount: promotion.minimumOrderAmount,
  endsAt: promotion.endsAt,
});

const notifyExistingCustomers = async (promotion) => {
  try {
    const recipients = await userModel
      .find({ isEmailVerified: true })
      .select("name email")
      .lean();

    return await sendPromotionAnnouncement(promotion, recipients);
  } catch (error) {
    console.error("Promotion was saved, but customer announcement emails could not be sent", error);
    return { sent: 0, failed: 0, error: true };
  }
};

// ======================================================
// DISCOUNT CALCULATION
// ======================================================

const discountFor = (promotion, subtotalCents) => {
  if (promotion.discountType === "percentage") {
    return Math.min(
      subtotalCents,
      Math.round(
        (subtotalCents * promotion.discountValue) / 100
      )
    );
  }

  return Math.min(
    subtotalCents,
    Math.round(promotion.discountValue * 100)
  );
};

// ======================================================
// PROMOTION QUOTE
// ======================================================

const getPromotionQuote = async ({
  subtotalCents,
  code,
}) => {
  const promotions = await getActivePromotions();

  const enteredCode =
    typeof code === "string"
      ? code.trim().toUpperCase()
      : "";

  let selectedPromotion;

  if (enteredCode) {
    if (enteredCode.length > 24) {
      return {
        error: "That promo code is invalid.",
      };
    }

    selectedPromotion = promotions.find(
      (promotion) =>
        promotion.applicationType === "code" &&
        promotion.code === enteredCode &&
        subtotalCents >=
          Math.round(
            Number(
              promotion.minimumOrderAmount || 0
            ) * 100
          )
    );

    if (!selectedPromotion) {
      return {
        error:
          "That code is invalid, expired, or your order does not meet its minimum.",
      };
    }
  } else {
    selectedPromotion = promotions
      .filter(
        (promotion) =>
          promotion.applicationType === "automatic" &&
          subtotalCents >=
            Math.round(
              Number(
                promotion.minimumOrderAmount || 0
              ) * 100
            )
      )
      .map((promotion) => ({
        promotion,
        discountCents: discountFor(
          promotion,
          subtotalCents
        ),
      }))
      .sort(
        (first, second) =>
          second.discountCents -
          first.discountCents
      )[0]?.promotion;
  }

  const discountCents = selectedPromotion
    ? discountFor(
        selectedPromotion,
        subtotalCents
      )
    : 0;

  return {
    promotion:
      selectedPromotion || null,
    discountCents,
    subtotalCents,
    deliveryCents: DELIVERY_FEE_CENTS,
    totalCents:
      subtotalCents -
      discountCents +
      DELIVERY_FEE_CENTS,
  };
};

// ======================================================
// VALIDATE PROMOTION INPUT
// ======================================================

const validatePromotionInput = (body = {}) => {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      error:
        "Check the promotion details and try again.",
    };
  }

  const title =
    typeof body.title === "string"
      ? body.title.trim()
      : "";

  const message =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  const discountType =
    body.discountType;

  const applicationType =
    body.applicationType;

  const discountValue =
    Number(body.discountValue);

  const minimumOrderAmount =
    Number(body.minimumOrderAmount);

  const startsAt =
    new Date(body.startsAt);

  const endsAt =
    new Date(body.endsAt);

  const code =
    typeof body.code === "string"
      ? body.code.trim().toUpperCase()
      : "";

  if (
    title.length < 2 ||
    title.length > 80 ||
    message.length < 2 ||
    message.length > 180 ||
    !["percentage", "fixed"].includes(
      discountType
    ) ||
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (
      discountType === "percentage" &&
      discountValue > 100
    ) ||
    (
      discountType === "fixed" &&
      discountValue > 10000
    ) ||
    Number(discountValue.toFixed(2)) !==
      discountValue ||
    !["automatic", "code"].includes(
      applicationType
    ) ||
    !Number.isFinite(
      minimumOrderAmount
    ) ||
    minimumOrderAmount < 0 ||
    minimumOrderAmount > 100000 ||
    Number.isNaN(
      startsAt.getTime()
    ) ||
    Number.isNaN(
      endsAt.getTime()
    ) ||
    startsAt >= endsAt ||
    (
      applicationType === "code" &&
      !/^[A-Z0-9-]{3,24}$/.test(code)
    ) ||
    (
      body.isActive !== undefined &&
      typeof body.isActive !== "boolean"
    )
  ) {
    return {
      error:
        "Check the promotion details and try again.",
    };
  }

  return {
    value: {
      title,
      message,
      discountType,
      discountValue,
      applicationType,
      ...(applicationType === "code"
        ? { code }
        : {}),
      minimumOrderAmount,
      startsAt,
      endsAt,
      isActive:
        body.isActive ?? true,
    },
  };
};

// ======================================================
// LIST ACTIVE PROMOTIONS
// ======================================================

export const listActivePromotions =
  async (_req, res) => {
    try {
      const promotions =
        await getActivePromotions();

      res.json({
        success: true,
        data: promotions.map(
          toPublicPromotion
        ),
      });
    } catch (error) {
      console.error(
        "Unable to load active promotions",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Promotions are unavailable right now.",
      });
    }
  };

// ======================================================
// QUOTE PROMOTION
// ======================================================

export const quotePromotion =
  async (req, res) => {
    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    const subtotal =
      Number(body.subtotal);

    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0 ||
      subtotal > 100000 ||
      (
        body.code !== undefined &&
        typeof body.code !== "string"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid order subtotal.",
      });
    }

    try {
      const quote =
        await getPromotionQuote({
          subtotalCents:
            Math.round(
              subtotal * 100
            ),
          code: body.code,
        });

      if (quote.error) {
        return res.status(400).json({
          success: false,
          message: quote.error,
        });
      }

      return res.json({
        success: true,
        data: {
          promotion:
            quote.promotion
              ? toPublicPromotion(
                  quote.promotion
                )
              : null,
          discount:
            quote.discountCents / 100,
          delivery:
            quote.deliveryCents / 100,
          total:
            quote.totalCents / 100,
        },
      });
    } catch (error) {
      console.error(
        "Unable to calculate promotion quote",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "We couldn't check that offer.",
      });
    }
  };

// ======================================================
// LIST PROMOTIONS
// ======================================================

export const listPromotions =
  async (_req, res) => {
    try {
      const promotions =
        await promotionModel
          .find()
          .sort({ createdAt: -1 })
          .lean();

      res.json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      console.error(
        "Unable to list promotions",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "We couldn't load promotions.",
      });
    }
  };

// ======================================================
// CREATE PROMOTION
// ======================================================

export const createPromotion =
  async (req, res) => {
    const validated =
      validatePromotionInput(
        req.body
      );

    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error,
      });
    }

    try {
      const promotion =
        await promotionModel.create(
          validated.value
        );
      const emailNotification = promotion.isActive
        ? await notifyExistingCustomers(promotion)
        : null;

      return res.status(201).json({
        success: true,
        data: promotion,
        ...(emailNotification && { emailNotification }),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "That promo code is already in use.",
        });
      }

      console.error(
        "Unable to create promotion",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "We couldn't create the promotion.",
      });
    }
  };

// ======================================================
// UPDATE PROMOTION
// ======================================================

export const updatePromotion =
  async (req, res) => {
    if (
      !mongoose.isValidObjectId(
        req.params.promotionId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid promotion.",
      });
    }

    const validated =
      validatePromotionInput(
        req.body
      );

    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error,
      });
    }

    try {
      const existingPromotion = await promotionModel
        .findById(req.params.promotionId)
        .lean();

      if (!existingPromotion) {
        return res.status(404).json({
          success: false,
          message: "Promotion not found.",
        });
      }

      const update = {
        $set: validated.value,

        ...(validated.value
          .applicationType !== "code" && {
          $unset: {
            code: 1,
          },
        }),
      };

      const promotion =
        await promotionModel.findByIdAndUpdate(
          req.params.promotionId,
          update,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message:
            "Promotion not found.",
        });
      }

      const emailNotification =
        !existingPromotion.isActive && promotion?.isActive
          ? await notifyExistingCustomers(promotion)
          : null;

      return res.json({
        success: true,
        data: promotion,
        ...(emailNotification && { emailNotification }),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "That promo code is already in use.",
        });
      }

      console.error(
        "Unable to update promotion",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "We couldn't update the promotion.",
      });
    }
  };

// ======================================================
// ALLOCATE DISCOUNT
// ======================================================

const allocateDiscount = (
  lines,
  discountCents,
  subtotalCents
) => {
  if (
    !discountCents ||
    !subtotalCents
  ) {
    return lines
      .map((line) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${line.name} × ${line.quantity}`,
          },
          unit_amount:
            line.amountCents,
        },
        quantity: 1,
      }))
      .filter(
        (line) =>
          line.price_data.unit_amount > 0
      );
  }

  const allocations =
    lines.map(
      (line, index) => {
        const exactShare =
          (discountCents *
            line.amountCents) /
          subtotalCents;

        return {
          index,
          cents:
            Math.floor(exactShare),
          remainder:
            exactShare % 1,
        };
      }
    );

  let remainingCents =
    discountCents -
    allocations.reduce(
      (sum, allocation) =>
        sum + allocation.cents,
      0
    );

  allocations.sort(
    (first, second) =>
      second.remainder -
      first.remainder
  );

  for (
    let index = 0;
    remainingCents > 0;
    index =
      (index + 1) %
      allocations.length
  ) {
    allocations[index].cents += 1;
    remainingCents -= 1;
  }

  const discountByLine =
    new Map(
      allocations.map(
        (allocation) => [
          allocation.index,
          allocation.cents
        ]
      )
    );

  return lines
    .map((line, index) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${line.name} × ${line.quantity}`,
        },
        unit_amount:
          line.amountCents -
          (discountByLine.get(index) ||
            0),
      },
      quantity: 1,
    }))
    .filter(
      (line) =>
        line.price_data.unit_amount > 0
    );
};

// ======================================================
// PLACE DISCOUNTED ORDER
// ONLINE + COD
// ======================================================

export const placeDiscountedOrder =
  async (req, res) => {
    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    const requestedItems =
      Array.isArray(body.items)
        ? body.items
        : [];

    const address =
      body.address;

    // ==================================================
    // PAYMENT METHOD
    // ==================================================

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod
            .trim()
            .toLowerCase()
        : "online";

    if (
      !["online", "cod"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid payment method.",
      });
    }

    // ==================================================
    // VALIDATE ORDER
    // ==================================================

    if (
      !requestedItems.length ||
      requestedItems.length > 50 ||
      !address ||
      typeof address !== "object" ||
      !body.userId ||
      (
        body.promotionCode !==
          undefined &&
        typeof body.promotionCode !==
          "string"
      ) ||
      requestedItems.some(
        (item) =>
          !item ||
          !mongoose.isValidObjectId(
            item._id
          ) ||
          !Number.isInteger(
            Number(item.quantity)
          ) ||
          Number(item.quantity) < 1 ||
          Number(item.quantity) > 50
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid order details.",
      });
    }

    let savedOrderId;

    try {
      // ==================================================
      // CHECK DUPLICATE ITEMS
      // ==================================================

      const itemIds =
        requestedItems.map(
          (item) =>
            String(item._id)
        );

      if (
        new Set(itemIds).size !==
        itemIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate order items are not allowed.",
        });
      }

      // ==================================================
      // GET REAL FOOD DATA FROM DATABASE
      // ==================================================

      const foods =
        await foodModel
          .find({
            _id: {
              $in: itemIds,
            },
          })
          .lean();

      if (
        foods.length !==
        requestedItems.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more menu items are no longer available.",
        });
      }

      const foodsById =
        new Map(
          foods.map((food) => [
            String(food._id),
            food,
          ])
        );

      // ==================================================
      // CALCULATE PRICES
      // ==================================================

      const pricedLines =
        requestedItems.map(
          (item) => {
            const food =
              foodsById.get(
                String(item._id)
              );

            const quantity =
              Number(
                item.quantity
              );

            const unitCents =
              Math.round(
                Number(food.price) *
                  100
              );

            return {
              ...food,
              quantity,
              price:
                unitCents / 100,
              amountCents:
                unitCents *
                quantity,
            };
          }
        );

      const subtotalCents =
        pricedLines.reduce(
          (sum, line) =>
            sum +
            line.amountCents,
          0
        );

      // ==================================================
      // CALCULATE PROMOTION
      // ==================================================

      const quote =
        await getPromotionQuote({
          subtotalCents,
          code:
            body.promotionCode,
        });

      if (quote.error) {
        return res.status(400).json({
          success: false,
          message: quote.error,
        });
      }

      // ==================================================
      // PREPARE ORDER ITEMS
      // ==================================================

      const orderItems =
        pricedLines.map(
          ({
            amountCents:
              _amountCents,
            ...item
          }) => item
        );

      const totalCents =
        quote.totalCents;

      // ==================================================
      // CREATE ORDER
      // ==================================================

      const newOrder =
        new orderModel({
          userId:
            body.userId,

          items:
            orderItems,

          subtotal:
            subtotalCents / 100,

          discount:
            quote.discountCents /
            100,

          promotionCode:
            quote.promotion?.code ||
            "",

          promotionTitle:
            quote.promotion?.title ||
            "",

          amount:
            totalCents / 100,

          address,

          status:
            "Food Processing",

          payment:
            false,

          paymentMethod:
            paymentMethod,
        });

      await newOrder.save();

      savedOrderId =
        newOrder._id;

      // ==================================================
      // CASH ON DELIVERY
      // ==================================================

      if (
        paymentMethod === "cod"
      ) {
        const customer = await userModel.findByIdAndUpdate(
          body.userId,
          {
            cartData: {},
          },
          { new: true }
        ).select("name email").lean();

        let emailNotificationSent = false;
        try {
          if (!customer?.email) {
            throw new Error("The order customer does not have an email address.");
          }
          await sendOrderPlacedNotification(
            customer.email,
            customer.name,
            newOrder
          );
          emailNotificationSent = true;
        } catch (emailError) {
          console.error(
            "COD order was placed, but its confirmation email could not be sent",
            emailError?.code || emailError?.name || "Unknown email error"
          );
        }

        let adminEmailNotificationSent = false;
        try {
          await sendAdminOrderNotification(
            customer?.email,
            customer?.name,
            newOrder
          );
          adminEmailNotificationSent = true;
        } catch (emailError) {
          console.error(
            "COD order was placed, but its admin notification email could not be sent",
            emailError?.code || emailError?.name || "Unknown email error"
          );
        }

        return res.json({
          success: true,

          paymentMethod:
            "cod",

          orderId:
            newOrder._id,

          emailNotificationSent,
          adminEmailNotificationSent,

          message:
            "Order placed successfully. Please pay cash when your order is delivered.",
        });
      }

      // ==================================================
      // ONLINE PAYMENT
      // ==================================================

      if (!stripe) {
        await orderModel.findByIdAndDelete(
          savedOrderId
        );

        return res.status(503).json({
          success: false,
          message:
            "Online payment is temporarily unavailable.",
        });
      }

      // ==================================================
      // CREATE STRIPE ITEMS
      // ==================================================

      const lineItems =
        allocateDiscount(
          pricedLines,
          quote.discountCents,
          subtotalCents
        );

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Charges",
          },
          unit_amount:
            DELIVERY_FEE_CENTS,
        },
        quantity: 1,
      });

      // ==================================================
      // STRIPE CHECKOUT
      // ==================================================

      const session =
        await stripe.checkout.sessions.create({
          line_items:
            lineItems,

          mode: "payment",

          success_url:
            `${frontendUrl}/verify?success=true&orderId=${newOrder._id}`,

          cancel_url:
            `${frontendUrl}/verify?success=false&orderId=${newOrder._id}`,
        });

      // ==================================================
      // CLEAR CART
      // ==================================================

      await userModel.findByIdAndUpdate(
        body.userId,
        {
          cartData: {},
        }
      );

      return res.json({
        success: true,

        paymentMethod:
          "online",

        session_url:
          session.url,

        orderId:
          newOrder._id,
      });

    } catch (error) {

      if (savedOrderId) {
        try {
          await orderModel.findByIdAndDelete(
            savedOrderId
          );
        } catch (cleanupError) {
          console.error(
            "Unable to remove an order after checkout failed",
            cleanupError
          );
        }
      }

      console.error(
        "Unable to create discounted order",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "We couldn't start checkout.",
      });
    }
  };