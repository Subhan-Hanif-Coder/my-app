import nodemailer from "nodemailer";

let transporter;
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "iamsubhanhaneef123@gmail.com";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  if (!user || !password) {
    throw new Error(
      "Customer email notifications require EMAIL_USER and EMAIL_PASSWORD.",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: password },
    });
  }

  return transporter;
};

const sendEmail = async (to, subject, text, html) => {
  if (typeof to !== "string" || !to.trim()) {
    throw new Error("Customer email address is missing.");
  }

  const emailUser = process.env.EMAIL_USER;
  await getTransporter().sendMail({
    from: `"Tomato" <${emailUser}>`,
    to,
    replyTo: emailUser,
    subject,
    text,
    html,
  });
};

const emailLayout = (heading, content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;padding:28px;border:1px solid #eee;border-radius:12px;color:#30352f">
    <h2 style="color:#ff4c24;margin-top:0">${escapeHtml(heading)}</h2>
    ${content}
    <p style="color:#777;font-size:13px;margin-top:28px">Tomato Restaurant</p>
  </div>
`;

export const sendPromotionAnnouncement = async (promotion, recipients) => {
  const eligibleRecipients = recipients.filter(
    (recipient) =>
      typeof recipient.email === "string" && recipient.email.trim(),
  );

  if (!eligibleRecipients.length) {
    return { sent: 0, failed: 0 };
  }

  const mailer = getTransporter();
  const discount =
    promotion.discountType === "percentage"
      ? `${promotion.discountValue}% off`
      : `$${Number(promotion.discountValue).toFixed(2)} off`;
  const code =
    promotion.applicationType === "code"
      ? `Use promo code: ${promotion.code}`
      : "Your discount will be applied automatically at checkout.";
  const startsAt = new Date(promotion.startsAt).toLocaleString();
  const endsAt = new Date(promotion.endsAt).toLocaleString();
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < eligibleRecipients.length; index += 5) {
    const batch = eligibleRecipients.slice(index, index + 5);
    const results = await Promise.allSettled(
      batch.map((recipient) => {
        const greeting = recipient.name ? `Hello ${recipient.name},` : "Hello,";
        const text = [
          greeting,
          "",
          promotion.title,
          promotion.message,
          discount,
          code,
          `Available from: ${startsAt}`,
          `Offer ends: ${endsAt}`,
          "",
          "We hope to see you soon!",
          "Tomato Restaurant",
        ].join("\n");
        const html = emailLayout(
          promotion.title,
          `<p>${escapeHtml(greeting)}</p>
         <p>${escapeHtml(promotion.message)}</p>
         <p style="font-size:22px;font-weight:bold;color:#ff4c24">${escapeHtml(discount)}</p>
         <p>${escapeHtml(code)}</p>
         <p>Available from: ${escapeHtml(startsAt)}<br>Offer ends: ${escapeHtml(endsAt)}</p>`,
        );

        return mailer.sendMail({
          from: `"Tomato" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          replyTo: process.env.EMAIL_USER,
          subject: `Tomato offer: ${promotion.title}`,
          text,
          html,
        });
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sent += 1;
      } else {
        failed += 1;
        console.error(
          "A promotion announcement email could not be sent:",
          result.reason?.code || result.reason?.name || "Unknown email error",
        );
      }
    }
  }

  return { sent, failed };
};

export const sendOrderPlacedNotification = async (email, name, order) => {
  const customerName =
    name ||
    [order.address?.firstName, order.address?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Customer";
  const orderLines = (order.items || []).map(
    (item) =>
      `${item.name} × ${item.quantity} — $${(Number(item.price) * Number(item.quantity)).toFixed(2)}`,
  );
  const paymentMethod =
    order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online";
  const address = order.address || {};
  const deliveryAddress = [
    [
      address.street,
      address.city,
      address.state,
      address.zipcode,
      address.country,
    ]
      .filter(Boolean)
      .join(", "),
    address.phone ? `Phone: ${address.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Math.max(0, Number(order.amount || 0) - subtotal + discount);
  const priceSummary = [
    `Subtotal: $${subtotal.toFixed(2)}`,
    ...(discount > 0
      ? [
          `Discount${order.promotionCode ? ` (${order.promotionCode})` : ""}: -$${discount.toFixed(2)}`,
        ]
      : []),
    `Delivery: $${delivery.toFixed(2)}`,
    `Order total: $${Number(order.amount).toFixed(2)}`,
  ];
  const text = [
    `Hello ${customerName},`,
    "",
    `Your order #${order._id} has been placed.`,
    "",
    ...orderLines,
    "",
    ...priceSummary,
    `Payment: ${paymentMethod}`,
    ...(deliveryAddress ? ["", "Delivery address:", deliveryAddress] : []),
    "Thank you for ordering with Tomato Restaurant.",
  ].join("\n");
  const html = emailLayout(
    "Your order is confirmed",
    `<p>Hello ${escapeHtml(customerName)}, your order <b>#${escapeHtml(order._id)}</b> has been placed.</p>
     <ul>${orderLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
     <p>${priceSummary.map((line) => escapeHtml(line)).join("<br>")}<br><b>Payment:</b> ${escapeHtml(paymentMethod)}</p>
     ${deliveryAddress ? `<p><b>Delivery address:</b><br>${escapeHtml(deliveryAddress).replace(/\n/g, "<br>")}</p>` : ""}
     <p>Thank you for ordering with us.</p>`,
  );

  await sendEmail(email, `Tomato order confirmed: #${order._id}`, text, html);
};

export const sendAdminOrderNotification = async (customerEmail, name, order) => {
  const customerName =
    name ||
    [order.address?.firstName, order.address?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Customer";
  const orderLines = (order.items || []).map(
    (item) =>
      `${item.name} × ${item.quantity} — $${(Number(item.price) * Number(item.quantity)).toFixed(2)}`,
  );
  const paymentMethod =
    order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online";
  const address = order.address || {};
  const deliveryAddress = [
    [
      address.street,
      address.city,
      address.state,
      address.zipcode,
      address.country,
    ]
      .filter(Boolean)
      .join(", "),
    address.phone ? `Phone: ${address.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Math.max(0, Number(order.amount || 0) - subtotal + discount);
  const priceSummary = [
    `Subtotal: $${subtotal.toFixed(2)}`,
    ...(discount > 0
      ? [
          `Discount${order.promotionCode ? ` (${order.promotionCode})` : ""}: -$${discount.toFixed(2)}`,
        ]
      : []),
    `Delivery: $${delivery.toFixed(2)}`,
    `Order total: $${Number(order.amount).toFixed(2)}`,
  ];
  const text = [
    `A new order has been placed: #${order._id}`,
    "",
    `Customer: ${customerName}`,
    `Customer email: ${customerEmail || "Not available"}`,
    "",
    ...orderLines,
    "",
    ...priceSummary,
    `Payment: ${paymentMethod}`,
    ...(deliveryAddress ? ["", "Delivery address:", deliveryAddress] : []),
  ].join("\n");
  const html = emailLayout(
    "New order received",
    `<p>Order <b>#${escapeHtml(order._id)}</b> has been placed.</p>
     <p><b>Customer:</b> ${escapeHtml(customerName)}<br><b>Customer email:</b> ${escapeHtml(customerEmail || "Not available")}</p>
     <ul>${orderLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
     <p>${priceSummary.map((line) => escapeHtml(line)).join("<br>")}<br><b>Payment:</b> ${escapeHtml(paymentMethod)}</p>
     ${deliveryAddress ? `<p><b>Delivery address:</b><br>${escapeHtml(deliveryAddress).replace(/\n/g, "<br>")}</p>` : ""}`,
  );

  await sendEmail(
    ADMIN_EMAIL,
    `New Tomato order: #${order._id}`,
    text,
    html,
  );
};

export const sendOrderDeliveredNotification = async (email, name, order) => {
  const customerName =
    name ||
    [order.address?.firstName, order.address?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Customer";
  const text = [
    `Hello ${customerName},`,
    "",
    `Your Tomato order #${order._id} has been marked as delivered.`,
    "We hope you enjoy your meal. Thank you for choosing Tomato Restaurant.",
  ].join("\n");
  const html = emailLayout(
    "Your order has been delivered",
    `<p>Hello ${escapeHtml(customerName)},</p>
     <p>Your order <b>#${escapeHtml(order._id)}</b> has been marked as delivered.</p>
     <p>We hope you enjoy your meal. Thank you for choosing Tomato Restaurant.</p>`,
  );

  await sendEmail(email, `Tomato order delivered: #${order._id}`, text, html);
};
