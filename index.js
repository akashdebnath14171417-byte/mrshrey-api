// =====================================================================
// MR SHREY API - Node.js Version (RootX Name Removed)
// =====================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================================================================
// API KEY SYSTEM
// =====================================================================

const API_KEYS = {
  "MR_SHREY_MONTHLY_001": {
    key: "MR_SHREY_MONTHLY_001",
    plan: "1 Month",
    days: 30,
    daily_limit: 1000,
    created: "2026-08-13",
    expiry: "2026-09-13",
    used_today: 0,
    last_reset: "2026-08-13"
  },
  "MR_SHREY_2MONTH_001": {
    key: "MR_SHREY_2MONTH_001",
    plan: "2 Months",
    days: 60,
    daily_limit: 2000,
    created: "2026-08-13",
    expiry: "2026-10-13",
    used_today: 0,
    last_reset: "2026-08-13"
  },
  "MR_SHREY_3MONTH_001": {
    key: "MR_SHREY_3MONTH_001",
    plan: "3 Months",
    days: 90,
    daily_limit: 3000,
    created: "2026-08-13",
    expiry: "2026-11-13",
    used_today: 0,
    last_reset: "2026-08-13"
  },
  "MR_SHREY_MASTER_001": {
    key: "MR_SHREY_MASTER_001",
    plan: "Master (1 Year)",
    days: 365,
    daily_limit: 10000,
    created: "2026-08-13",
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
  
  const expiryDate = new Date(data.expiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
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
  
  const expiryDate = new Date(data.expiry);
  if (new Date() > expiryDate) {
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
// FAST FETCH WITH TIMEOUT
// =====================================================================

async function fastFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =====================================================================
// ROUTES
// =====================================================================

// Home
app.get('/', (req, res) => {
  res.json({
    service: "MR SHREY API Gateway",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    version: "4.0",
    status: "✅ All APIs Working",
    endpoints: {
      "/vehicle/:rc": { method: "GET", example: "/vehicle/MH12DE1433" },
      "/number/:phone": { method: "GET", example: "/number/9876543210" },
      "/aadhar/:id": { method: "GET", example: "/aadhar/123456789012" },
      "/upi/:vpa": { method: "GET", example: "/upi/example@axl" },
      "/pan/:pan": { method: "GET", params: { api_key: "Required" }, example: "/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
      "/keyinfo/:api_key": { method: "GET", example: "/keyinfo/MR_SHREY_MONTHLY_001" }
    },
    available_plans: {
      "1 Month": { key: "MR_SHREY_MONTHLY_001", daily_limit: 1000 },
      "2 Months": { key: "MR_SHREY_2MONTH_001", daily_limit: 2000 },
      "3 Months": { key: "MR_SHREY_3MONTH_001", daily_limit: 3000 },
      "Master (1 Year)": { key: "MR_SHREY_MASTER_001", daily_limit: 10000 }
    }
  });
});

// Key Info
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
// VEHICLE INFO (RootX Vehicle - Name Hidden)
// =============================================================
app.get('/vehicle/:rc', async (req, res) => {
  const rc = req.params.rc;
  
  try {
    const response = await fastFetch(
      `https://rootx-osint.in/?type=v_num&key=seed_bhai&query=${rc}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      8000
    );
    
    const data = await response.json();
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Vehicle API timeout",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// NUMBER INFO (RootX Number - Name Hidden)
// =============================================================
app.get('/number/:phone', async (req, res) => {
  const phone = req.params.phone;
  
  try {
    const response = await fastFetch(
      `https://rootx-osint.in/?type=num&key=seed_bhai&query=${phone}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      8000
    );
    
    const data = await response.json();
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Number API timeout",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// AADHAR INFO (RootX Aadhar - Name Hidden)
// =============================================================
app.get('/aadhar/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const response = await fastFetch(
      `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${id}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      8000
    );
    
    const data = await response.json();
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Aadhar API timeout",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// UPI INFO
// =============================================================
app.get('/upi/:vpa', async (req, res) => {
  const vpa = req.params.vpa;
  
  try {
    const response = await fastFetch(
      "https://www.amazon.in/apay/money-transfer/verify-vpa/v2",
      {
        method: "POST",
        headers: {
          "User-Agent": "Amazon.com/30.22.0.300 (Android/15/V2509)",
          "Content-Type": "application/json; charset=utf-8",
          "Origin": "https://www.amazon.in",
          "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
          "Cookie": "session-id=259-7081962-2819512"
        },
        body: JSON.stringify({
          recipientVpa: vpa,
          clientContext: { pageType: "EAP", useCase: "SEND_MONEY" }
        })
      },
      10000
    );
    
    const data = await response.json();
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "UPI request failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// PAN INFO (Requires API Key)
// =============================================================
app.get('/pan/:pan', async (req, res) => {
  const pan = req.params.pan;
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
    const response = await fastFetch(
      `https://turtlemintloans.com/api/minterprise/v1/products/personal-loan/leads/existing-lead-by-pan?pan=${pan}`,
      {
        headers: {
          "x-broker": "turtlemint",
          "authorization": "Bearer f13517d5a59b689d16aa30c528ccaf7801f823b0f5548f65d6d3793270cfe8d628cea877289aba166e5425c31cfc7a0b",
          "x-provider": "signzy",
          "content-type": "application/json"
        }
      },
      10000
    );
    
    const data = await response.json();
    validation.data.used_today += 1;
    const keyInfo = getKeyInfo(apiKey);
    
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: keyInfo,
      data: data
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
    channel: "https://t.me/MR_SHREY3",
    available: [
      "/vehicle/:rc",
      "/number/:phone",
      "/aadhar/:id",
      "/upi/:vpa",
      "/pan/:pan?api_key=...",
      "/keyinfo/:api_key"
    ]
  });
});

// =====================================================================
// START SERVER
// =====================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 MR SHREY API Gateway Running!                  ║
║   👨‍💻 Developer: MR SHREY                            ║
║   📢 Channel: https://t.me/MR_SHREY3                ║
║   🌐 Port: ${PORT}                                    ║
╚═══════════════════════════════════════════════════════╝
  `);
});
