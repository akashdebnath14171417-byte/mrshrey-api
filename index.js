// =====================================================================
// MR SHREY API - Simple & Fast
// =====================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================================================================
// API KEY SYSTEM (Fixed)
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

// =====================================================================
// HELPERS
// =====================================================================

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

// =====================================================================
// ROUTES
// =====================================================================

app.get('/', (req, res) => {
  res.json({
    service: "MR SHREY API Gateway",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    version: "4.0",
    status: "✅ Working",
    endpoints: {
      "/vehicle/:rc": { example: "/vehicle/MH12DE1433" },
      "/number/:phone": { example: "/number/9876543210" },
      "/aadhar/:id": { example: "/aadhar/123456789012" },
      "/upi/:vpa": { example: "/upi/example@axl" },
      "/pan/:pan": { params: "api_key", example: "/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
      "/keyinfo/:api_key": { example: "/keyinfo/MR_SHREY_MONTHLY_001" }
    }
  });
});

app.get('/keyinfo/:apiKey', (req, res) => {
  const keyInfo = getKeyInfo(req.params.apiKey);
  res.json({
    status: keyInfo ? "success" : "error",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    key_info: keyInfo || "Invalid API Key!"
  });
});

// =============================================================
// VEHICLE
// =============================================================
app.get('/vehicle/:rc', async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=v_num&key=seed_bhai&query=${req.params.rc}`,
      { timeout: 8000 }
    );
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Vehicle API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// NUMBER
// =============================================================
app.get('/number/:phone', async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=num&key=seed_bhai&query=${req.params.phone}`,
      { timeout: 8000 }
    );
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Number API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// AADHAR
// =============================================================
app.get('/aadhar/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${req.params.id}`,
      { timeout: 8000 }
    );
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Aadhar API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// UPI
// =============================================================
app.get('/upi/:vpa', async (req, res) => {
  try {
    const response = await axios.post(
      "https://www.amazon.in/apay/money-transfer/verify-vpa/v2",
      {
        recipientVpa: req.params.vpa,
        clientContext: { pageType: "EAP", useCase: "SEND_MONEY" }
      },
      {
        headers: {
          "User-Agent": "Amazon.com/30.22.0.300 (Android/15/V2509)",
          "Content-Type": "application/json",
          "Origin": "https://www.amazon.in",
          "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html"
        },
        timeout: 10000
      }
    );
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "UPI API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// PAN (Requires API Key)
// =============================================================
app.get('/pan/:pan', async (req, res) => {
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
    const response = await axios.get(
      `https://turtlemintloans.com/api/minterprise/v1/products/personal-loan/leads/existing-lead-by-pan?pan=${req.params.pan}`,
      {
        headers: {
          "x-broker": "turtlemint",
          "authorization": "Bearer f13517d5a59b689d16aa30c528ccaf7801f823b0f5548f65d6d3793270cfe8d628cea877289aba166e5425c31cfc7a0b",
          "x-provider": "signzy"
        },
        timeout: 10000
      }
    );
    
    validation.data.used_today += 1;
    const keyInfo = getKeyInfo(apiKey);
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: keyInfo,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "PAN API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3"
  });
});

// =====================================================================
// START
// =====================================================================

app.listen(PORT, () => {
  console.log(`🚀 MR SHREY API running on port ${PORT}`);
});
