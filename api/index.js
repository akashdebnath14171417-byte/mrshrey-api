// =====================================================================
// MR SHREY API - Render Server (Final)
// =====================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

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

// =====================================================================
// MIDDLEWARE - API KEY CHECK
// =====================================================================

async function checkApiKey(req, res, next) {
  const apiKey = req.query.api_key || req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      status: "error",
      message: "❌ API Key Required! Get your key from @MR_SHREY3",
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
  
  req.apiKeyData = validation.data;
  req.apiKey = apiKey;
  next();
}

// =====================================================================
// 91WHEELS API
// =====================================================================

async function get91WheelsData(rcNumber) {
  const sessionId = `${uuidv4()}-${uuidv4()}`;
  
  try {
    const response = await axios.post(
      "https://api1.91wheels.com/api/v1/third/rc-detail",
      {
        regNo: rcNumber.trim().toUpperCase(),
        sessionid: sessionId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://www.91wheels.com",
          "Referer": "https://www.91wheels.com/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// FIXED UPI API - Decodes Amazon HTML Response
// =====================================================================

async function getUpiInfo(vpa) {
  try {
    const response = await axios.post(
      "https://www.amazon.in/apay/money-transfer/verify-vpa/v2",
      {
        recipientVpa: vpa,
        clientContext: { pageType: "EAP", useCase: "SEND_MONEY" }
      },
      {
        headers: {
          "User-Agent": "Amazon.com/30.22.0.300 (Android/15/V2509)",
          "Content-Type": "application/json",
          "Origin": "https://www.amazon.in",
          "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
          "Cookie": "session-id=259-7081962-2819512"
        },
        timeout: 15000
      }
    );
    
    // If response is HTML, extract JSON from it
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      // Try to find JSON in the HTML
      const jsonMatch = response.data.match(/(\{.*\})/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          return { status: "error", message: "Could not parse Amazon response", raw: response.data.substring(0, 200) };
        }
      }
      return { status: "error", message: "Amazon returned HTML page", raw: response.data.substring(0, 200) };
    }
    
    return response.data;
  } catch (error) {
    // If error response has data, try to extract JSON
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        const jsonMatch = data.match(/(\{.*\})/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1]);
          } catch (e) {}
        }
        return { status: "error", message: "Amazon returned HTML page", raw: data.substring(0, 200) };
      }
      return { status: "error", message: "UPI API error", raw: data };
    }
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// ROOTX API - FIXED: Replaces @simpleguy444 with @MR_SHREY2
// =====================================================================

async function getRootXData(type, query) {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=${type}&key=seed_bhai&query=${query}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
    );
    
    const data = response.data;
    
    // Replace @simpleguy444 with @MR_SHREY2 everywhere
    const jsonStr = JSON.stringify(data);
    const fixedStr = jsonStr.replace(/@simpleguy444/g, '@MR_SHREY2');
    
    return JSON.parse(fixedStr);
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// API ROUTES
// =====================================================================

// =============================================================
// HOME (No API Key Required)
// =============================================================
app.get('/', (req, res) => {
  res.json({
    service: "MR SHREY API Gateway",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    version: "10.0",
    status: "✅ All APIs Working",
    auth: "❌ API Key Required for all endpoints",
    how_to_get_key: "Contact @MR_SHREY3",
    endpoints: {
      "/vehicle-91/:rc": { method: "GET", params: { api_key: "Required" }, example: "/vehicle-91/WB74BG4531?api_key=YOUR_KEY" },
      "/vehicle-merged/:rc": { method: "GET", params: { api_key: "Required" }, example: "/vehicle-merged/WB74BG4531?api_key=YOUR_KEY" },
      "/number/:phone": { method: "GET", params: { api_key: "Required" }, example: "/number/8967844123?api_key=YOUR_KEY" },
      "/aadhar/:id": { method: "GET", params: { api_key: "Required" }, example: "/aadhar/212028834716?api_key=YOUR_KEY" },
      "/upi/:vpa": { method: "GET", params: { api_key: "Required" }, example: "/upi/8967844123@ybl?api_key=YOUR_KEY" },
      "/pan/:pan": { method: "GET", params: { api_key: "Required" }, example: "/pan/JCZPS4827P?api_key=YOUR_KEY" },
      "/keyinfo/:api_key": { method: "GET", example: "/keyinfo/MR_SHREY_MONTHLY_001" }
    }
  });
});

// =============================================================
// KEY INFO
// =============================================================
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
// VEHICLE - 91WHEELS ONLY (API Key Required)
// =============================================================
app.get('/vehicle-91/:rc', checkApiKey, async (req, res) => {
  const rc = req.params.rc;
  const regClean = rc.toUpperCase().replace(/[\s-]/g, '');
  
  try {
    const data = await get91WheelsData(regClean);
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      source: "91Wheels",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "91Wheels API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// VEHICLE - MERGED (API Key Required)
// =============================================================
app.get('/vehicle-merged/:rc', checkApiKey, async (req, res) => {
  const rc = req.params.rc;
  const regClean = rc.toUpperCase().replace(/[\s-]/g, '');
  
  try {
    const rcData = await get91WheelsData(regClean);
    
    if (rcData.status === "error") {
      return res.status(500).json({
        status: "error",
        message: "91Wheels fetch failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      });
    }
    
    const data = rcData?.data || {};
    req.apiKeyData.used_today += 1;
    
    res.json({
      status: "success",
      source: "91Wheels",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Merged API failed",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3"
    });
  }
});

// =============================================================
// NUMBER INFO (API Key Required)
// =============================================================
app.get('/number/:phone', checkApiKey, async (req, res) => {
  try {
    const data = await getRootXData('num', req.params.phone);
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: data
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
// AADHAR INFO (API Key Required)
// =============================================================
app.get('/aadhar/:id', checkApiKey, async (req, res) => {
  try {
    const data = await getRootXData('aadhar_fam_v2', req.params.id);
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: data
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
// UPI INFO (API Key Required - Fixed)
// =============================================================
app.get('/upi/:vpa', checkApiKey, async (req, res) => {
  try {
    const data = await getUpiInfo(req.params.vpa);
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: data
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
// PAN INFO (API Key Required)
// =============================================================
app.get('/pan/:pan', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get(
      `https://turtlemintloans.com/api/minterprise/v1/products/personal-loan/leads/existing-lead-by-pan?pan=${req.params.pan}`,
      {
        headers: {
          "x-broker": "turtlemint",
          "authorization": "Bearer f13517d5a59b689d16aa30c528ccaf7801f823b0f5548f65d6d3793270cfe8d628cea877289aba166e5425c31cfc7a0b",
          "x-provider": "signzy",
          "content-type": "application/json"
        },
        timeout: 15000
      }
    );
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
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

// =============================================================
// 404
// =============================================================
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
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 MR SHREY API Running on Render!                ║
║   👨‍💻 Developer: MR SHREY                            ║
║   📢 Channel: https://t.me/MR_SHREY3                ║
║   🌐 Port: ${PORT}                                    ║
╚═══════════════════════════════════════════════════════╝
  `);
});
