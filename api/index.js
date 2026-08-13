// =====================================================================
// MR SHREY API - Render Server
// =====================================================================

const http = require('http');

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
// CORS HEADERS
// =====================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// =====================================================================
// SERVER
// =====================================================================

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const parts = path.split('/').filter(p => p);
  const query = url.searchParams;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // =============================================================
  // HOME
  // =============================================================
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: "MR SHREY API Gateway",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      version: "8.0",
      status: "✅ All APIs Working",
      endpoints: {
        "/vehicle/:rc": { example: "/vehicle/MH12DE1433" },
        "/number/:phone": { example: "/number/9876543210" },
        "/aadhar/:id": { example: "/aadhar/123456789012" },
        "/upi/:vpa": { example: "/upi/example@axl" },
        "/pan/:pan": { params: "api_key", example: "/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
        "/keyinfo/:api_key": { example: "/keyinfo/MR_SHREY_MONTHLY_001" }
      }
    }, null, 2));
    return;
  }

  // =============================================================
  // KEY INFO
  // =============================================================
  if (parts[0] === 'keyinfo' && parts.length === 2) {
    const keyInfo = getKeyInfo(parts[1]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: keyInfo ? "success" : "error",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: keyInfo || "Invalid API Key!"
    }, null, 2));
    return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: error.message || "Vehicle API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
    }
    return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: error.message || "Number API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
    }
    return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: error.message || "Aadhar API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
    }
    return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: error.message || "UPI API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
    }
    return;
  }

  // =============================================================
  // PAN (Requires API Key)
  // =============================================================
  if (parts[0] === 'pan' && parts.length === 2) {
    const apiKey = query.get('api_key');
    if (!apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: "❌ API Key Required!",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
      return;
    }
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: validation.error,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
      return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        key_info: keyInfo,
        data: data
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "error",
        message: error.message || "PAN API failed",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }));
    }
    return;
  }

  // =============================================================
  // 404
  // =============================================================
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
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
  }, null, 2));
});

// =====================================================================
// START
// =====================================================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 MR SHREY API Running on Render!                ║
║   👨‍💻 Developer: MR SHREY                            ║
║   📢 Channel: https://t.me/MR_SHREY3                ║
║   🌐 Port: ${PORT}                                    ║
╚═══════════════════════════════════════════════════════╝
  `);
});
