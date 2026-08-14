// =====================================================================
// MR SHREY API - Real 91Wheels + Parivahan (No Mock Data)
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
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        },
        timeout: 30000
      }
    );
    
    if (response.status === 200) {
      return response.data;
    } else {
      return { status: "error", message: `91Wheels Error: ${response.status}` };
    }
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// REAL PARIVAHAN API (Full Implementation)
// =====================================================================

const HOMEPAGE_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml?statecd=Mzc2MzM2MzAzNjY0MzIzODM3NjIzNjY0MzY2MjM3NDQ0Yw==";
const HOMEPAGE_BASE = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml";
const LOGIN_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/usermgmt/login.xhtml";
const FORM_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/balanceservice/form_reschedule_fitness.xhtml";

const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

const AJAX_HEADERS = {
  ...BASE_HEADERS,
  "Accept": "application/xml, text/xml, */*; q=0.01",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "Faces-Request": "partial/ajax",
  "X-Requested-With": "XMLHttpRequest",
  "Origin": "https://vahan.parivahan.gov.in",
};

async function fetchParivahanMobile(vnum, last5) {
  let vs = null;
  let chk = "j_idt187";
  
  try {
    // Step 1: Homepage
    const r1 = await axios.get(HOMEPAGE_URL, { headers: BASE_HEADERS, timeout: 30000 });
    if (r1.status !== 200) {
      return { status: "error", message: `Step1: HTTP ${r1.status}` };
    }
    
    // Extract ViewState
    const vsMatch = r1.data.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    vs = vsMatch ? vsMatch[1] : null;
    if (!vs) return { status: "error", message: "ViewState missing" };
    
    // Extract checkbox ID
    const chkMatch = r1.data.match(/id="(j_idt\d+)"[^>]*class="[^"]*ui-chkbox/);
    chk = chkMatch ? chkMatch[1] : "j_idt187";
    
    // Step 2: Select RTO
    const r2 = await axios.post(HOMEPAGE_BASE,
      new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": "fit_c_office_to",
        "javax.faces.partial.execute": "fit_c_office_to",
        "javax.faces.behavior.event": "change",
        "javax.faces.partial.event": "change",
        "homepageformid": "homepageformid",
        "j_idt12": "",
        "j_idt47_input": "en",
        "state_cd_filter": "",
        "fit_c_office_to_input": "1",
        "abc": "abc",
        "javax.faces.ViewState": vs,
        "pmtchk_input": "-1",
        "nocregnno": "",
      }).toString(),
      { headers: { ...AJAX_HEADERS, "Referer": HOMEPAGE_URL }, timeout: 30000 }
    );
    const vs2 = r2.data.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs2) vs = vs2[1];
    
    // Step 3: Checkbox
    const r3 = await axios.post(HOMEPAGE_BASE,
      new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": chk,
        "javax.faces.partial.execute": chk,
        "javax.faces.partial.render": "proccedHomeButtonId",
        "javax.faces.behavior.event": "change",
        "javax.faces.partial.event": "change",
        "homepageformid": "homepageformid",
        "j_idt12": "",
        "j_idt47_input": "en",
        "state_cd_filter": "",
        "fit_c_office_to_input": "1",
        [`${chk}_input`]: "on",
        "abc": "abc",
        "javax.faces.ViewState": vs,
        "pmtchk_input": "-1",
        "nocregnno": "",
      }).toString(),
      { headers: AJAX_HEADERS, timeout: 30000 }
    );
    const vs3 = r3.data.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs3) vs = vs3[1];
    
    // Step 4: Proceed
    const r4 = await axios.post(HOMEPAGE_BASE,
      new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": "proccedHomeButtonId",
        "javax.faces.partial.execute": "@all",
        "javax.faces.partial.render": "regnid facelesslist portaldownMsgPnl mainhomepagepnl leftmenupnlid leftmenupnlidservdown",
        "proccedHomeButtonId": "proccedHomeButtonId",
        "homepageformid": "homepageformid",
        "j_idt12": "",
        "j_idt47_input": "en",
        "state_cd_filter": "",
        "fit_c_office_to_input": "1",
        [`${chk}_input`]: "on",
        "abc": "abc",
        "javax.faces.ViewState": vs,
        "pmtchk_input": "-1",
        "nocregnno": "",
      }).toString(),
      { headers: AJAX_HEADERS, timeout: 30000 }
    );
    const vs4 = r4.data.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs4) vs = vs4[1];
    
    // Step 5: Dialog
    const dm = r4.data.match(/id="(j_idt\d+)"[^>]*class="[^"]*ui-button/);
    const dbt = dm ? dm[1] : "j_idt536";
    const r5 = await axios.post(HOMEPAGE_BASE,
      new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": dbt,
        "javax.faces.partial.execute": "@all",
        [`${dbt}`]: dbt,
        "homepageformid": "homepageformid",
        "j_idt12": "",
        "j_idt47_input": "en",
        "state_cd_filter": "",
        "fit_c_office_to_input": "1",
        [`${chk}_input`]: "on",
        "pmtchk_input": "-1",
        "nocregnno": "",
        "javax.faces.ViewState": vs,
      }).toString(),
      { headers: AJAX_HEADERS, timeout: 30000 }
    );
    const vs5 = r5.data.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs5) vs = vs5[1];
    
    // Step 6: Login
    const r6 = await axios.get(LOGIN_URL + "?faces-redirect=true", { headers: BASE_HEADERS, timeout: 30000 });
    const vs6 = r6.data.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    if (!vs6) return { status: "error", message: "Login ViewState missing" };
    vs = vs6[1];
    
    // Step 7: Login submit
    const fm = r6.data.match(/id="(j_idt\d+)"[^>]*name="\1"[^>]*type="submit"/);
    const fbt = fm ? fm[1] : "j_idt506";
    await axios.post(LOGIN_URL,
      new URLSearchParams({
        "loginForm": "loginForm",
        [`${fbt}`]: fbt,
        "javax.faces.ViewState": vs,
        "InputEnter": "",
        "fitbalcTest": "fitbalcTest",
        "pur_cd": "86",
      }).toString(),
      {
        headers: { ...BASE_HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000
      }
    );
    
    // Step 8: Form page
    const r8 = await axios.get(FORM_URL, { headers: BASE_HEADERS, timeout: 30000 });
    const vs8 = r8.data.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    if (!vs8) return { status: "error", message: "Form ViewState missing" };
    vs = vs8[1];
    
    // Step 9: Submit with chassis last 5
    const r9 = await axios.post(FORM_URL,
      new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": "balanceFeesFine:validate_dtls",
        "javax.faces.partial.execute": "@all",
        "javax.faces.partial.render": "balanceFeesFine:auth_panel",
        "balanceFeesFine:validate_dtls": "balanceFeesFine:validate_dtls",
        "balanceFeesFine": "balanceFeesFine",
        "balanceFeesFine:tf_reg_no": vnum,
        "balanceFeesFine:tf_chasis_no": last5,
        "javax.faces.ViewState": vs,
      }).toString(),
      { headers: { ...AJAX_HEADERS, "Referer": FORM_URL }, timeout: 30000 }
    );
    const body = r9.data;
    
    // Step 10: Extract mobile number
    const patterns = [
      /id="balanceFeesFine:tf_mobile"[^>]*value="(\d{10})"/,
      /value="(\d{10})"[^>]*id="balanceFeesFine:tf_mobile"/,
      /balanceFeesFine:tf_mobile[^>]*value="(\d{10})"/,
    ];
    for (const pat of patterns) {
      const m = body.match(pat);
      if (m && m[1] && /^[6-9]/.test(m[1])) {
        return { status: "ok", mobile: m[1] };
      }
    }
    
    const hits = body.match(/\b([6-9]\d{9})\b/g);
    if (hits && hits.length > 0) {
      return { status: "ok", mobile: hits[0] };
    }
    
    return { status: "error", message: "Mobile number not found" };
  } catch (error) {
    return { status: "error", message: `Parivahan Error: ${error.message}` };
  }
}

// =====================================================================
// MERGE DATA
// =====================================================================

function mergeData(rcData, parivahanData) {
  const data = rcData?.data || {};
  
  const merged = {
    status: "success",
    source: "91Wheels + Parivahan (Merged)",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    vehicle_number: data?.rc_number || data?.regNo,
    chassis_number: data?.vehicle_chasi_number || null,
    engine_number: data?.vehicle_engine_number || null,
    owner_name: data?.owner_name || null,
    registration_date: data?.registration_date || null,
    fitness_upto: data?.fit_up_to || data?.tax_upto || null,
    insurance_upto: data?.insurance_upto || null,
    tax_upto: data?.tax_upto || null,
    vehicle_details: {
      maker: data?.maker_description || null,
      model: data?.maker_model || null,
      fuel_type: data?.fuel_type || null,
      color: data?.color || null,
      vehicle_category: data?.vehicle_category_description || null,
      manufacturing_date: data?.manufacturing_date_formatted || null,
      cubic_capacity: data?.cubic_capacity || null,
      seat_capacity: data?.seat_capacity || null,
      body_type: data?.body_type || null,
      norms: data?.norms_type || null,
      rc_status: data?.rc_status || null
    },
    owner_details: {
      name: data?.owner_name || null,
      present_address: data?.present_address || null,
      permanent_address: data?.permanent_address || null,
      mobile: data?.mobile_number || null,
      owner_number: data?.owner_number || null,
      parivahan_mobile: parivahanData?.status === "ok" ? parivahanData.mobile : null
    },
    registration_details: {
      registered_at: data?.registered_at || null,
      registration_date: data?.registration_date || null,
      rto_code: data?.rto_code || null,
      fit_up_to: data?.fit_up_to || null,
      tax_upto: data?.tax_upto || null,
      tax_paid_upto: data?.tax_paid_upto || null
    },
    insurance_details: {
      company: data?.insurance_company || null,
      policy_number: data?.insurance_policy_number || null,
      insurance_upto: data?.insurance_upto || null,
      pucc_number: data?.pucc_number || null,
      pucc_upto: data?.pucc_upto || null
    },
    additional_details: {
      vehicle_weight: data?.vehicle_gross_weight || null,
      unladen_weight: data?.unladen_weight || null,
      wheelbase: data?.wheelbase || null,
      no_cylinders: data?.no_cylinders || null,
      variant: data?.variant || null,
      makeData: data?.makeData || null,
      modelData: data?.modelData || null,
      year_of_purchase: data?.yearofPurchase || null,
      financed: data?.financed || null,
      financer: data?.financer || null
    }
  };
  
  return merged;
}

// =====================================================================
// API ENDPOINTS
// =====================================================================

app.get('/', (req, res) => {
  res.json({
    service: "MR SHREY API Gateway",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    version: "9.0",
    status: "✅ All APIs Working",
    endpoints: {
      "/vehicle-91/:rc": { example: "/vehicle-91/WB74BG4531", description: "Only 91Wheels" },
      "/vehicle-merged/:rc": { example: "/vehicle-merged/WB74BG4531", description: "91Wheels + Real Parivahan" },
      "/number/:phone": { example: "/number/8967844123" },
      "/aadhar/:id": { example: "/aadhar/212028834716" },
      "/upi/:vpa": { example: "/upi/8967844123@ybl" },
      "/pan/:pan": { params: "api_key", example: "/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
      "/keyinfo/:api_key": { example: "/keyinfo/MR_SHREY_MONTHLY_001" }
    }
  });
});

// =============================================================
// VEHICLE - 91WHEELS ONLY
// =============================================================
app.get('/vehicle-91/:rc', async (req, res) => {
  const rc = req.params.rc;
  const regClean = rc.toUpperCase().replace(/[\s-]/g, '');
  
  try {
    const data = await get91WheelsData(regClean);
    res.json({
      status: "success",
      source: "91Wheels",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
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
// VEHICLE - MERGED (91Wheels + Real Parivahan)
// =============================================================
app.get('/vehicle-merged/:rc', async (req, res) => {
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
    const chassis = data?.vehicle_chasi_number;
    let parivahanData = null;
    
    if (chassis) {
      const chassisClean = chassis.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const chassisLast5 = chassisClean.length >= 5 ? chassisClean.slice(-5) : chassisClean;
      parivahanData = await fetchParivahanMobile(regClean, chassisLast5);
    }
    
    const merged = mergeData(rcData, parivahanData);
    res.json(merged);
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
// NUMBER INFO
// =============================================================
app.get('/number/:phone', async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=num&key=seed_bhai&query=${req.params.phone}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
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
// AADHAR INFO
// =============================================================
app.get('/aadhar/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `https://rootx-osint.in/?type=aadhar_fam_v2&key=seed_bhai&query=${req.params.id}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }
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
// UPI INFO
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
          "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
          "Cookie": "session-id=259-7081962-2819512"
        },
        timeout: 15000
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
// PAN INFO (API Key Required)
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
          "x-provider": "signzy",
          "content-type": "application/json"
        },
        timeout: 15000
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
