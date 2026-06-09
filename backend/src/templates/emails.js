/**
 * Monochrome luxury email template - black & white only.
 */
const BRAND = process.env.BRAND_NAME || "GymSword";
const SUPPORT = process.env.SUPPORT_EMAIL || "support@gymsword.com";

export function buildEmailHtml({ title, heading, body, ctaLabel, ctaUrl }) {
  const cta =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:#000;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;border:1px solid #000">${ctaLabel}</a>`
      : "";
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;background:#f5f5f7;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e6e6e6">
        <tr><td style="padding:36px 40px;background:#000;color:#fff;text-align:center">
          <div style="font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.22em">${BRAND}</div>
          <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#999;margin-top:8px">Forge Your Strength</div>
        </td></tr>
        <tr><td style="padding:48px 40px">
          <h1 style="font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:28px;letter-spacing:0.02em;margin:0 0 24px 0;color:#0a0a0a">${heading}</h1>
          <div style="font-size:15px;line-height:1.7;color:#333">${body}</div>
          ${cta ? `<div style="margin-top:36px">${cta}</div>` : ""}
        </td></tr>
        <tr><td style="padding:24px 40px 36px;border-top:1px solid #eee;color:#888;font-size:11px;line-height:1.6">
          Questions? Reply to this email or write to <a href="mailto:${SUPPORT}" style="color:#000">${SUPPORT}</a>.
          <br/><br/>© ${new Date().getFullYear()} ${BRAND}. Forged in steel.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
