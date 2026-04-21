export function generateEmailTemplate(verificationCode) {
  const digits = String(verificationCode).split('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alumni Portal - Verification Code</title>
  <style>
    /* Reset */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #eef2f7; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; }

    .email-wrapper { padding: 40px 20px; background-color: #eef2f7; }
    .email-container { max-width: 580px; margin: 0 auto; }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1b3a6b 0%, #0f2244 100%);
      border-radius: 16px 16px 0 0;
      padding: 36px 44px;
      position: relative;
      overflow: hidden;
    }
    .header-circle-1 {
      position: absolute; top: -60px; right: -60px;
      width: 200px; height: 200px;
      background: rgba(212,175,55,0.12); border-radius: 50%;
    }
    .header-circle-2 {
      position: absolute; bottom: -80px; left: 30px;
      width: 160px; height: 160px;
      background: rgba(255,255,255,0.04); border-radius: 50%;
    }
    .header-inner {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 16px;
    }
    .header-icon {
      width: 54px; height: 54px; min-width: 54px;
      background: #d4af37; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(212,175,55,0.4);
    }
    .header-icon svg { width: 28px; height: 28px; fill: #1b3a6b; }
    .header-title { font-family: Georgia, serif; font-size: 20px; color: #fff; font-weight: 700; letter-spacing: 0.02em; line-height: 1.2; }
    .header-subtitle { font-size: 11.5px; color: #a8bcd8; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }

    /* Gold strip */
    .gold-strip { background: #d4af37; height: 5px; }

    /* Body */
    .body {
      background: #ffffff;
      padding: 50px 44px 44px;
      border-left: 1px solid #dde3ed;
      border-right: 1px solid #dde3ed;
    }
    .label { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #d4af37; font-weight: 600; margin: 0 0 14px 0; }
    .headline { font-family: Georgia, serif; font-size: 30px; color: #0f2244; line-height: 1.25; margin: 0 0 18px 0; }
    .headline em { font-style: italic; color: #1b3a6b; }
    .intro-text { font-size: 15px; line-height: 1.8; color: #5a6070; font-weight: 300; margin: 0 0 38px 0; }
    .intro-text strong { color: #0f2244; font-weight: 600; }

    /* OTP block */
    .otp-block {
      background: linear-gradient(135deg, #0f2244 0%, #1b3a6b 100%);
      border-radius: 14px; padding: 36px 24px;
      text-align: center; margin-bottom: 32px;
      position: relative; overflow: hidden;
    }
    .otp-circle-1 { position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(212,175,55,0.1); border-radius: 50%; }
    .otp-circle-2 { position: absolute; bottom: -50px; left: -20px; width: 130px; height: 130px; background: rgba(255,255,255,0.03); border-radius: 50%; }
    .otp-label { font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #a8bcd8; margin: 0 0 18px 0; position: relative; z-index: 1; }
    .otp-digits { display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
    .otp-digit {
      width: 52px; height: 62px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(212,175,55,0.4);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-family: Georgia, serif; font-size: 30px; font-weight: 700; color: #d4af37;
    }
    .otp-validity { margin-top: 16px; font-size: 12px; color: #7a93b8; position: relative; z-index: 1; }
    .otp-validity strong { color: #e8c96a; }

    /* Alert */
    .alert-box {
      display: flex; gap: 13px;
      background: #fdf6e3;
      border-left: 4px solid #d4af37;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px; margin-bottom: 36px;
      align-items: flex-start;
    }
    .alert-icon { font-size: 18px; line-height: 1; margin-top: 1px; flex-shrink: 0; }
    .alert-text { font-size: 13px; color: #7a5c10; line-height: 1.65; margin: 0; }
    .alert-text a { color: #7a5c10; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #edf0f5; margin-bottom: 28px; }

    /* Links section */
    .links-heading { font-size: 13.5px; line-height: 1.8; color: #5a6070; font-weight: 300; margin: 0 0 16px 0; }
    .links-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
    .link-pill {
      display: inline-block;
      background: #f3f6fb; border: 1px solid #dde3ed;
      border-radius: 8px; padding: 9px 18px;
      font-size: 13px; color: #1b3a6b;
      text-decoration: none; font-weight: 600;
      letter-spacing: 0.02em;
    }

    .footer-note { font-size: 13px; color: #9aa3b0; line-height: 1.75; margin: 0; }
    .footer-note a { color: #1b3a6b; text-decoration: underline; }

    /* Footer */
    .footer {
      background: #0f2244;
      border-radius: 0 0 16px 16px;
      padding: 30px 44px;
    }
    .footer-top {
      display: flex; justify-content: space-between;
      align-items: flex-start; flex-wrap: wrap; gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 18px;
    }
    .footer-brand-name { font-family: Georgia, serif; font-size: 15px; color: #d4af37; margin-bottom: 4px; }
    .footer-brand-tagline { font-size: 11.5px; color: #5a7099; }
    .footer-links { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
    .footer-link { font-size: 11.5px; color: #5a7099; text-decoration: none; letter-spacing: 0.04em; }
    .footer-copy { font-size: 11px; color: #3d5278; line-height: 1.65; }

    /* =====================
       RESPONSIVE / MOBILE
       ===================== */
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px; }

      .header { padding: 24px 20px; border-radius: 12px 12px 0 0; }
      .header-title { font-size: 17px; }
      .header-subtitle { font-size: 10px; }
      .header-icon { width: 44px; height: 44px; min-width: 44px; }
      .header-icon svg { width: 22px; height: 22px; }

      .body { padding: 32px 20px 28px; }
      .headline { font-size: 22px; }
      .intro-text { font-size: 14px; margin-bottom: 28px; }

      .otp-block { padding: 28px 16px; }
      .otp-digits { gap: 7px; }
      .otp-digit { width: 40px; height: 52px; font-size: 24px; border-radius: 8px; }

      .links-grid { gap: 8px; }
      .link-pill { font-size: 12px; padding: 8px 14px; }

      .footer { padding: 24px 20px; border-radius: 0 0 12px 12px; }
      .footer-top { flex-direction: column; gap: 12px; }
      .footer-links { gap: 12px; }
    }

    @media only screen and (max-width: 380px) {
      .otp-digit { width: 34px; height: 46px; font-size: 20px; border-radius: 6px; }
      .otp-digits { gap: 5px; }
      .headline { font-size: 19px; }
    }
  </style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-container">

    <!-- Header -->
    <div class="header">
      <div class="header-circle-1"></div>
      <div class="header-circle-2"></div>
      <div class="header-inner">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
        </div>
        <div>
          <div class="header-title">Alumni Connect Portal</div>
          <div class="header-subtitle">Your Alumni Community</div>
        </div>
      </div>
    </div>

    <!-- Gold Strip -->
    <div class="gold-strip"></div>

    <!-- Body -->
    <div class="body">

      <p class="label">🎓 Account Verification</p>

      <h1 class="headline">
        Welcome back, <em>distinguished alumni.</em>
      </h1>

      <p class="intro-text">
        You've requested to verify your identity on the <strong>Alumni Connect Portal</strong>. Use the one-time code below to complete your verification and reconnect with your alumni community.
      </p>

      <!-- OTP Block -->
      <div class="otp-block">
        <div class="otp-circle-1"></div>
        <div class="otp-circle-2"></div>

        <p class="otp-label">Your One-Time Verification Code</p>

        <div class="otp-digits">
          ${digits.map(digit => `<div class="otp-digit">${digit}</div>`).join('')}
        </div>

        <p class="otp-validity">
          ⏱ &nbsp;Valid for <strong>10 minutes</strong> only
        </p>
      </div>

      <!-- Alert Box -->
      <div class="alert-box">
        <span class="alert-icon">🔒</span>
        <p class="alert-text">
          For your security, never share this code with anyone — including Alumni Portal staff. If you did not request this code, please <a href="#">secure your account</a> immediately.
        </p>
      </div>

      <hr class="divider" />

      <p class="links-heading">After verifying, explore what's waiting for you:</p>
      <div class="links-grid">
        <a href="#" class="link-pill">🗓 Upcoming Events</a>
        <a href="#" class="link-pill">🤝 Network Directory</a>
        <a href="#" class="link-pill">📰 Alumni News</a>
        <a href="#" class="link-pill">🎓 Job Board</a>
      </div>

      <hr class="divider" />

      <p class="footer-note">
        Didn't request this email? You can safely ignore it — your account remains secure. Need help? <a href="#">Contact Alumni Support</a>.
      </p>

    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-top">
        <div>
          <div class="footer-brand-name">Alumni Connect Portal</div>
          <div class="footer-brand-tagline">Connecting generations, building futures.</div>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">Unsubscribe</a>
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Help Center</a>
        </div>
      </div>
      <div class="footer-copy">
        © 2026 Alumni Connect Portal · University Campus, Main Street · All rights reserved.<br/>
        You are receiving this email because you registered on the Alumni Connect Portal.
      </div>
    </div>

  </div>
</div>
</body>
</html>`;
}