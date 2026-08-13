// =====================================================================
// MR SHREY API - Next.js API Routes
// =====================================================================

const API_KEYS = {
  "MR_SHREY_MONTHLY_001": {
    key: "MR_SHREY_MONTHLY_001",
    plan: "1 Month",
    daily_limit: 1000,
    expiry: "2026-09-13",
    used_today: 0,
    last_reset: "2026-08-13"
  },
  "MR_SHREY_MASTER_001": {
    key: "MR_SHREY_MASTER_001",
    plan: "Master (1 Year)",
    daily_limit: 10000,
    expiry: "2027-08-13",
    used_today: 0,
    last_reset: "2026-08-13"
  }
};

function getKeyInfo(apiKey) {
  const data = API_KEYS[apiKey];
  if (!data) return null;
  const daysLeft = Math.ceil((new Date(data.expiry) - new Date()) / (1000 * 60 * 60 * 24));
  return {
    plan: data.plan,
    expiry: data.expiry,
    days_left: daysLeft,
    daily_limit: data.daily_limit,
    used_today: data.used_today,
    remaining_today: data.daily_limit - data.used_today,
    status: daysLeft > 0 ? "Active" : "Expired"
  };
}

function validateApiKey(apiKey) {
  const data = API_KEYS[apiKey];
  if (!data) return { valid: false, error: "❌ Invalid API Key!" };
  if (new Date() > new Date(data.expiry)) {
    return { valid: false, error: "❌ API Key Expired!" };
  }
  const today = new Date().toISOString().split('T')[0];
  if (data.last_reset !== today) {
    data.used_today = 0;
    data.last_reset = today;
  }
  if (data.used_today >= data.daily_limit) {
    return { valid: false, error: `❌ Daily Limit Reached! (0/${data.daily_limit} remaining)` };
  }
  return { valid: true, data };
}

export default async function handler(req, res) {
  const { query } = req;
  const parts = query.path || [];
  const method = req.method;
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // =============================================================
  // HOME
  // =============================================================
  if (parts.length === 0) {
    return res.status(200).json({
      service: "MR SHREY API Gateway",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      version: "7.0",
      status: "✅ All APIs Working",
      endpoints: {
        "/api/vehicle/:rc": { example: "/api/vehicle/MH12DE1433" },
        "/api/number/:phone": { example: "/api/number/9876543210" },
        "/api/aadhar/:id": { example: "/api/aadhar/123456789012" },
        "/api/upi/:vpa": { example: "/api/upi/example@axl" },
        "/api/pan/:pan": { params: "api_key", example: "/api/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
        "/api/keyinfo/:api_key": { example: "/api/keyinfo/MR_SHREY_MONTHLY_001" }
      }
    });
  }
  
  // =============================================================
  // KEY INFO
  // =============================================================
  if (parts[0] === "keyinfo" && parts.length === 2) {
    const keyInfo = getKeyInfo(parts[1]);
    return res.status(200).json({
      status: keyInfo ? "success" : "error",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: keyInfo || "Invalid API Key!"
    });
  }
  
  // =============================================================
  // VEHICLE
  // =============================================================
  if (parts[0] === "vehicle" && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=v_num&key=seed_bhai&query=${parts[1]}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const data = await response.json();
      return res.status(200).json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "Vehicle API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
  }
  
  // =============================================================
  // NUMBER
  // =============================================================
  if (parts[0] === "number" && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=num&key=seed_bhai&query=${parts[1]}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const data = await response.json();
      return res.status(200).json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "Number API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
  }
  
  // =============================================================
  // AADHAR
  // =============================================================
  if (parts[0] === "aadhar" && parts.length === 2) {
    try {
      const response = await fetch(
        `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${parts[1]}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const data = await response.json();
      return res.status(200).json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "Aadhar API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
  }
  
  // =============================================================
  // UPI
  // =============================================================
  if (parts[0] === "upi" && parts.length === 2) {
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
      return res.status(200).json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "UPI API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
  }
  
  // =============================================================
  // PAN (Requires API Key)
  // =============================================================
  if (parts[0] === "pan" && parts.length === 2) {
    const apiKey = req.query.api_key;
    if (!apiKey) {
      return res.status(400).json({
        status: "error",
        message: "❌ API Key Required!",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      return res.status(403).json({
        status: "error",
        message: validation.error,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
    try {
      const response = await fetch(
        `https://turtlemintloans.com/api/minterprise/v1/products/personal-loan/leads/existing-lead-by-pan?pan=${parts[1]}`,
        {
          headers: {
            "x-broker": "turtlemint",
            "authorization": "Bearer f13517d5a59b689d16aa30c528ccaf7801f823b0f5548f65d6d3793270cfe8d628cea877289aba166e5425c31cfc7a0b",
            "x-provider": "signzy",
            "content-type": "application/json"
          }
        }
      );
      const data = await response.json();
      validation.data.used_today += 1;
      const keyInfo = getKeyInfo(apiKey);
      return res.status(200).json({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        key_info: keyInfo,
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "PAN API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
  }
  
  return res.status(404).json({
    status: "error",
    message: "Endpoint not found",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3"
  });
}
