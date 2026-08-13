// =====================================================================
// MR SHREY API - Vercel Serverless (Final)
// =====================================================================

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const path = req.url.split('?')[0];
  const parts = path.split('/').filter(p => p);
  const query = req.query;

  // =============================================================
  // HOME
  // =============================================================
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    return res.json({
      service: "MR SHREY API",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      status: "✅ Working",
      endpoints: {
        "/api/vehicle/:rc": "/api/vehicle/MH12DE1433",
        "/api/number/:phone": "/api/number/9876543210",
        "/api/aadhar/:id": "/api/aadhar/123456789012",
        "/api/upi/:vpa": "/api/upi/example@axl"
      }
    });
  }

  // =============================================================
  // VEHICLE
  // =============================================================
  if (parts[0] === 'vehicle' && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=v_num&key=seed_bhai&query=${parts[1]}`
      );
      const data = await response.json();
      return res.json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  // =============================================================
  // NUMBER
  // =============================================================
  if (parts[0] === 'number' && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=num&key=seed_bhai&query=${parts[1]}`
      );
      const data = await response.json();
      return res.json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  // =============================================================
  // AADHAR
  // =============================================================
  if (parts[0] === 'aadhar' && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${parts[1]}`
      );
      const data = await response.json();
      return res.json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  // =============================================================
  // UPI
  // =============================================================
  if (parts[0] === 'upi' && parts.length === 2) {
    try {
      const response = await fetch(
        "https://www.amazon.in/apay/money-transfer/verify-vpa/v2",
        {
          method: "POST",
          headers: {
            "User-Agent": "Amazon.com/30.22.0.300 (Android/15/V2509)",
            "Content-Type": "application/json",
            "Origin": "https://www.amazon.in",
            "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
            "Cookie": "session-id=259-7081962-2819512"
          },
          body: JSON.stringify({
            recipientVpa: parts[1],
            clientContext: { pageType: "EAP", useCase: "SEND_MONEY" }
          })
        }
      );
      const data = await response.json();
      return res.json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  // =============================================================
  // 404
  // =============================================================
  return res.status(404).json({
    status: "error",
    message: "Endpoint not found",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3"
  });
};
