/**
 * Email service using Resend, with a console-log fallback when no API key is set.
 * All template content is defined here so the application can be configured by
 * env vars only (no code changes needed when plugging in Resend later).
 */
import { Resend } from "resend";
import { buildEmailHtml } from "../templates/emails.js";

const BRAND = process.env.BRAND_NAME || "GymSword";
const FROM = process.env.RESEND_FROM_EMAIL || `${BRAND} <no-reply@gymsword.com>`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@gymsword.com";

let client = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

async function send({ to, subject, html, replyTo }) {
  const c = getClient();
  if (!c) {
    console.log(
      `[email:fallback] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"\n${html.slice(0, 200)}...`
    );
    return { id: "fallback", to, subject };
  }
  try {
    const { data, error } = await c.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[email] send failed:", err?.message || err);
    return { id: "error", error: err?.message };
  }
}

export const supportEmail = () => SUPPORT_EMAIL;

export async function sendWelcomeEmail(user) {
  const html = buildEmailHtml({
    title: `Welcome to ${BRAND}`,
    heading: `Welcome, ${user.name?.split(" ")[0] || "athlete"}.`,
    body: `You're now part of the GymSword inner circle. We forge luxury athleisure for those who refuse to be ordinary.`,
    ctaLabel: "Shop the Collection",
    ctaUrl: `${process.env.FRONTEND_URL}/shop`,
  });
  return send({ to: user.email, subject: `Welcome to ${BRAND}`, html });
}

export async function sendPasswordResetEmail(user, resetLink) {
  const html = buildEmailHtml({
    title: `${BRAND} Password Reset`,
    heading: "Reset your password",
    body: `We received a request to reset your password. The link below is valid for 60 minutes. If you didn't request this, you can safely ignore this email.`,
    ctaLabel: "Reset Password",
    ctaUrl: resetLink,
  });
  return send({ to: user.email, subject: `Reset your ${BRAND} password`, html });
}

export async function sendOrderConfirmationEmail(order, user) {
  const itemsRows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${it.name}${
          it.size ? ` · ${it.size}` : ""
        } × ${it.qty}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #eee">₹${(
          it.price * it.qty
        ).toLocaleString("en-IN")}</td></tr>`
    )
    .join("");
  const html = buildEmailHtml({
    title: `${BRAND} Order ${order.order_number}`,
    heading: `Order Confirmed`,
    body: `Thank you for your order, ${user.name?.split(" ")[0] || "athlete"}. We've received your order <strong>${
      order.order_number
    }</strong>.<br/><br/><table style="width:100%;border-collapse:collapse;font-size:14px">${itemsRows}<tr><td style="padding-top:12px;font-weight:600">Total</td><td style="padding-top:12px;text-align:right;font-weight:600">₹${order.total.toLocaleString(
      "en-IN"
    )}</td></tr></table>`,
    ctaLabel: "View Order",
    ctaUrl: `${process.env.FRONTEND_URL}/order/${order.id}`,
  });
  return send({ to: user.email, subject: `Order ${order.order_number} confirmed`, html });
}

export async function sendOrderStatusEmail(order, user) {
  const html = buildEmailHtml({
    title: `${BRAND} Order Update`,
    heading: `Your order is now ${String(order.status).toUpperCase()}`,
    body: `Order <strong>${order.order_number}</strong> status has been updated.`,
    ctaLabel: "Track Order",
    ctaUrl: `${process.env.FRONTEND_URL}/order/${order.id}`,
  });
  return send({ to: user.email, subject: `Update on order ${order.order_number}`, html });
}

export async function sendContactConfirmationEmail(contact) {
  const html = buildEmailHtml({
    title: `${BRAND} - we received your message`,
    heading: `Thanks for reaching out`,
    body: `Hi ${contact.name || "there"}, we've received your message and a member of our team will reply within 24 hours.<br/><br/><strong>Subject:</strong> ${contact.subject || "—"}<br/><strong>Your message:</strong><br/>${(contact.message || "").replace(
      /\n/g,
      "<br/>"
    )}`,
  });
  return send({ to: contact.email, subject: `We received your message`, html });
}

export async function sendContactNotificationEmail(contact) {
  const html = buildEmailHtml({
    title: `New contact form message`,
    heading: `New contact: ${contact.subject || "—"}`,
    body: `<strong>From:</strong> ${contact.name || "—"} &lt;${contact.email}&gt;<br/><strong>Subject:</strong> ${
      contact.subject || "—"
    }<br/><strong>Message:</strong><br/>${(contact.message || "").replace(/\n/g, "<br/>")}`,
  });
  return send({
    to: SUPPORT_EMAIL,
    subject: `[GymSword Contact] ${contact.subject || "New message"}`,
    html,
    replyTo: contact.email,
  });
}
