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
// GET MOBILE NUMBER FROM ROOTX (Hidden - No Name Display)
// =====================================================================

async function getMobileFromRootX(rcNumber) {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=v_num&key=seed_bhai&query=${rcNumber}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
    );
    
    const data = response.data;
    if (data && data.data && data.data.mobile_number) {
      return { status: "success", mobile: data.data.mobile_number };
    }
    if (data && data.mobile_number) {
      return { status: "success", mobile: data.mobile_number };
    }
    return { status: "error", message: "Mobile number not found" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// UPI API
// =====================================================================

async function getUpiInfo(vpa) {
  try {
    const response = await axios.post(
      "https://www.amazon.in/apay/money-transfer/verify-vpa/v2",
      {
        recipientVpa: vpa,
        clientContext: {
          pageType: "EAP",
          useCase: "SEND_MONEY"
        }
      },
      {
        headers: {
          'User-Agent': "Amazon.com/30.22.0.300 (Android/15/V2509)",
          'Accept': "application/json; charset=utf-8",
          'Accept-Encoding': "gzip, deflate, br, zstd",
          'sec-ch-ua-full-version-list': "",
          'sec-ch-ua-platform': '"Android"',
          'viewport-width': "384",
          'device-memory': "8",
          'sec-ch-ua': '"Not:A-Brand";v="99", "Android WebView";v="145", "Chromium";v="145"',
          'sec-ch-dpr': "1.875",
          'sec-ch-ua-mobile': "?1",
          'content-type': "application/json; charset=utf-8",
          'sec-ch-viewport-width': "384",
          'downlink': "10",
          'ect': "4g",
          'sec-ch-device-memory': "8",
          'dpr': "1.875",
          'rtt': "0",
          'sec-ch-ua-platform-version': '""',
          'origin': "https://www.amazon.in",
          'x-requested-with': "in.amazon.mShop.android.shopping",
          'sec-fetch-site': "same-origin",
          'sec-fetch-mode': "cors",
          'sec-fetch-dest': "empty",
          'referer': "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
          'accept-language': "en-IN,en-US;q=0.9,en;q=0.8",
          'priority': "u=1, i",
          'Cookie': "lc-acbin=en_IN; mobile-device-info=dpi:300.0|w:720|h:1600; amzn-app-id=Amazon.com/30.22.0.300/18.0.582129.0; i18n-prefs=INR; ubid-acbin=258-0293424-2815116; session-id=259-7081962-2819512; sid=; at-acbin=\"Atza|gQCtzrCGAwEBAj49e4rnUxcUPwvI2iGLbEpdA2TZmORJoNtuoVI4bq7YczbLfVb1sw4ku49PYoCBe2_DE8JOgp2SRoQ0DSvjCd-1bFprgBOFEnSLIGO7LQ5ze1THDDMbNE6JkaPTpjeMgVzct-JQR3r3rzvuZ9_rPI2IcLbhcUvpgo1Zx6kAfqmXDb0EutA4DFCEIoDYCQ__-1Jm_UHKjRXJrcI36_ta1BQxnaV6YdRbL81yl7MncrK8iQ-VjpRZO7iDplMPu5PNoFU9ucSDOdecTzGQvuwTChlmkomp_Cr9IuEJll0wMAx3eQxenjzQ-HdgKsZaoGeP9bp_NI3ad3uRUpsLW7A7x5q2ZLiSHL2p6D4ZLAvciQwwazwwdR49QTAEd8KpVjPfi4xi7pS05aOUx2a0QMUbpYuGDvtXvBlaQp3HV0dEtyS1wWaRqpVMmFLFlC3FFliuK-p1HGkaNs8fS3_RGEvlGKM9QQq8-GBztRfRe-Y\"; sess-at-acbin=\"V+DhprjkoLO3Zz1mR+qA0d9sR0cXrZwygqY8yE44xcw=\"; session-id-time=2082787201l; Domain=.amazon.in; Path=/; panch-token=eyJ0IjoxNzY2MDU5NTMwLCJ1bCI6W10sImlkIjoiNThjZDk4YWNlZDIxZThjMjc1MzZkNTcwZjc0MmJhMmUiLCJ2IjoxfQ==; privacy-consent=%7B%22avlString%22%3A%22%22%2C%22gvlString%22%3A%22%22%2C%22amazonAdvertisingPublisher%22%3Atrue%7D; Version=1; Max-Age=31536000; Expires=Tue, 19-Jan-2027 18:06:52 GMT; x-acbin=\"CcMttnTrHM3wwpWBRZ6ILOkk0qCbXfFOjjsSsnvxQhXCssMo@nEDbpR3YRAbG61z\"; amzn-app-ctxt=1.8%20%7B%22an%22%3A%22Amazon.com%22%2C%22av%22%3A%2230.22.0.300%22%2C%22xv%22%3A%221.16.0%22%2C%22os%22%3A%22Android%22%2C%22ov%22%3A%2215%22%2C%22cp%22%3A788760%2C%22uiv%22%3A4%2C%22ast%22%3A3%2C%22nal%22%3A%221%22%2C%22di%22%3A%7B%22pr%22%3A%22V2446iC%22%2C%22md%22%3A%22V2509%22%2C%22v%22%3A%22V2446%22%2C%22mf%22%3A%22vivo%22%2C%22dsn%22%3A%222df8901a9ca34ef48e1fc70480e942d4%22%2C%22dti%22%3A%22A1MPSLFC7L5AFK%22%2C%22ca%22%3A%22%22%2C%22ct%22%3A%22MOBILE%22%2C%22mct%22%3A13%7D%2C%22dm%22%3A%7B%22w%22%3A720%2C%22h%22%3A1600%2C%22ld%22%3A1.875%2C%22dx%22%3A265.7669982910156%2C%22dy%22%3A259.02099609375%2C%22pt%22%3A0%2C%22pb%22%3A78%7D%2C%22is%22%3A%22com.google.android.packageinstaller%22%2C%22msd%22%3A%22.amazon.in%22%7D; rxc=ADj0AqUSZ7ON8r3yYZU; session-token=VpKpW0kkLbYhCoH1IhYgmDkVGerV0YsBvBnJhU+htecJbmO/H63b5h47CLNlcmJKqGchAMtJc6MogIeX1VrPksfceSO2yaFeJIyNNnWBdIh6lzAnkTvb6AzWCFsRhM7D/5aDvO1TuJWeOLgw6O5Ub0ufrA41u3eoWKwi4cpH+DzA28S0eriPIT6a4+zKHYT5aeFAlWd62sv8sy54SY4F/OvI/FOvDv8KlLOC2z3DN4FNsCZod3IqtRbYr8vmruH8mx+oSrz+y5FK9sh+lJmbXrU1y6j4UfasRr2sb3qTEkeRCWuS1+ualjstAre1Tn+nBNCKkD5GcsIPcQOGNE8kBlhWi7WieKjewdGS6bhp03XFSUkxpg2MIUspWD8xDk7Q; csm-hit=tb:s-078D2AD48965425EBB54|1769320210453&t:1769320210662&adb:adblk_no"
        },
        timeout: 15000
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
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
    version: "13.0",
    status: "✅ All APIs Working",
    auth: "❌ API Key Required for all endpoints",
    how_to_get_key: "Contact @MR_SHREY3",
    endpoints: {
      "/vehicle-91/:rc": { 
        method: "GET", 
        params: { api_key: "Required" }, 
        example: "/vehicle-91/WB74BG4531?api_key=YOUR_KEY",
        description: "Only 91Wheels (No RootX)"
      },
      "/vehicle/:rc": { 
        method: "GET", 
        params: { api_key: "Required" }, 
        example: "/vehicle/WB74BG4531?api_key=YOUR_KEY",
        description: "91Wheels Full + Owner Mobile"
      },
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
// VEHICLE - ONLY 91WHEELS (No RootX)
// =============================================================
app.get('/vehicle-91/:rc', checkApiKey, async (req, res) => {
  const rc = req.params.rc;
  const regClean = rc.toUpperCase().replace(/[\s-]/g, '');
  
  try {
    const data = await get91WheelsData(regClean);
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      source: "91Wheels Only",
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
// VEHICLE - 91Wheels Full + Owner Mobile (Hidden RootX)
// =============================================================
app.get('/vehicle/:rc', checkApiKey, async (req, res) => {
  const rc = req.params.rc;
  const regClean = rc.toUpperCase().replace(/[\s-]/g, '');
  
  try {
    // Step 1: Get full 91Wheels data
    const wheelsData = await get91WheelsData(regClean);
    
    // Step 2: Get mobile number (from hidden source)
    let mobileNumber = null;
    try {
      const mobileResult = await getMobileFromRootX(regClean);
      if (mobileResult.status === "success") {
        mobileNumber = mobileResult.mobile;
      }
    } catch (e) {
      // Silent fail - mobile number optional
    }
    
    // Step 3: Merge - Add mobile number to 91Wheels data
    let finalData = wheelsData;
    if (mobileNumber) {
      if (finalData.data) {
        finalData.data.owner_mobile = mobileNumber;
        finalData.data.mobile_number = mobileNumber;
      } else if (finalData) {
        finalData.owner_mobile = mobileNumber;
        finalData.mobile_number = mobileNumber;
      }
    }
    
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      source: "91Wheels + Owner Mobile",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: finalData
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
// NUMBER INFO
// =============================================================
app.get('/number/:phone', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=num&key=seed_bhai&query=${req.params.phone}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
    );
    
    const data = response.data;
    const jsonStr = JSON.stringify(data);
    const fixedStr = jsonStr.replace(/@simpleguy444/g, '@MR_SHREY2');
    const fixedData = JSON.parse(fixedStr);
    
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: fixedData
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
// AADHAR INFO
// =============================================================
app.get('/aadhar/:id', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${req.params.id}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
    );
    
    const data = response.data;
    const jsonStr = JSON.stringify(data);
    const fixedStr = jsonStr.replace(/@simpleguy444/g, '@MR_SHREY2');
    const fixedData = JSON.parse(fixedStr);
    
    req.apiKeyData.used_today += 1;
    res.json({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: getKeyInfo(req.apiKey),
      data: fixedData
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
// UPI INFO
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
// PAN INFO
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
