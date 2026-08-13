// =====================================================================
// MR SHREY API - Deno Deploy Version
// Complete: 91Wheels + Parivahan + RootX + UPI
// =====================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// =====================================================================
// API KEY SYSTEM
// =====================================================================

const API_KEYS: Record<string, any> = {
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

function getKeyInfo(apiKey: string) {
  const data = API_KEYS[apiKey];
  if (!data) return null;
  
  const expiryDate = new Date(data.expiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
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

function validateApiKey(apiKey: string) {
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
// 91WHEELS API
// =====================================================================

async function get91WheelsData(rcNumber: string) {
  const sessionId = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  
  try {
    const response = await fetch("https://api1.91wheels.com/api/v1/third/rc-detail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.91wheels.com",
        "Referer": "https://www.91wheels.com/",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      },
      body: JSON.stringify({ regNo: rcNumber.trim().toUpperCase(), sessionid: sessionId })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      return { status: "error", message: `91Wheels Error: ${response.status}` };
    }
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// PARIVAHAN API (Mobile Number Fetch)
// =====================================================================

async function fetchParivahanMobile(vnum: string, last5: string) {
  const HOMEPAGE_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml?statecd=Mzc2MzM2MzAzNjY0MzIzODM3NjIzNjY0MzY2MjM3NDQ0Yw==";
  const HOMEPAGE_BASE = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml";
  const LOGIN_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/usermgmt/login.xhtml";
  const FORM_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/balanceservice/form_reschedule_fitness.xhtml";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  const ajaxHeaders = {
    ...headers,
    "Accept": "application/xml, text/xml, */*; q=0.01",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Faces-Request": "partial/ajax",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "https://vahan.parivahan.gov.in",
  };

  try {
    // Step 1: Homepage
    const r1 = await fetch(HOMEPAGE_URL, { headers });
    if (!r1.ok) return { status: "error", message: `Step1: HTTP ${r1.status}` };
    const html1 = await r1.text();

    // Extract ViewState
    const vsMatch = html1.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    let vs = vsMatch ? vsMatch[1] : null;
    if (!vs) return { status: "error", message: "ViewState missing" };

    // Extract checkbox ID
    const chkMatch = html1.match(/id="(j_idt\d+)"[^>]*class="[^"]*ui-chkbox/);
    const chk = chkMatch ? chkMatch[1] : "j_idt187";

    // Step 2: Select RTO
    const r2 = await fetch(HOMEPAGE_BASE, {
      method: "POST",
      headers: ajaxHeaders,
      body: new URLSearchParams({
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
      })
    });
    const text2 = await r2.text();
    const vs2 = text2.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs2) vs = vs2[1];

    // Step 3: Checkbox
    const r3 = await fetch(HOMEPAGE_BASE, {
      method: "POST",
      headers: ajaxHeaders,
      body: new URLSearchParams({
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
      })
    });
    const text3 = await r3.text();
    const vs3 = text3.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs3) vs = vs3[1];

    // Step 4: Proceed
    const r4 = await fetch(HOMEPAGE_BASE, {
      method: "POST",
      headers: ajaxHeaders,
      body: new URLSearchParams({
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
      })
    });
    const text4 = await r4.text();
    const vs4 = text4.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs4) vs = vs4[1];

    // Step 5: Dialog button
    const dm = text4.match(/id="(j_idt\d+)"[^>]*class="[^"]*ui-button/);
    const dbt = dm ? dm[1] : "j_idt536";
    const r5 = await fetch(HOMEPAGE_BASE, {
      method: "POST",
      headers: ajaxHeaders,
      body: new URLSearchParams({
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
      })
    });
    const text5 = await r5.text();
    const vs5 = text5.match(/<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (vs5) vs = vs5[1];

    // Step 6: Login
    const r6 = await fetch(`${LOGIN_URL}?faces-redirect=true`, { headers });
    const html6 = await r6.text();
    const vs6 = html6.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    if (!vs6) return { status: "error", message: "Login ViewState missing" };
    vs = vs6[1];

    // Step 7: Login submit
    const fm = html6.match(/id="(j_idt\d+)"[^>]*name="\1"[^>]*type="submit"/);
    const fbt = fm ? fm[1] : "j_idt506";
    await fetch(LOGIN_URL, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "loginForm": "loginForm",
        [`${fbt}`]: fbt,
        "javax.faces.ViewState": vs,
        "InputEnter": "",
        "fitbalcTest": "fitbalcTest",
        "pur_cd": "86",
      })
    });

    // Step 8: Form page
    const r8 = await fetch(FORM_URL, { headers });
    const html8 = await r8.text();
    const vs8 = html8.match(/<input[^>]*name="javax\.faces\.ViewState"[^>]*value="([^"]*)"[^>]*>/);
    if (!vs8) return { status: "error", message: "Form ViewState missing" };
    vs = vs8[1];

    // Step 9: Submit with chassis last 5
    const r9 = await fetch(FORM_URL, {
      method: "POST",
      headers: ajaxHeaders,
      body: new URLSearchParams({
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": "balanceFeesFine:validate_dtls",
        "javax.faces.partial.execute": "@all",
        "javax.faces.partial.render": "balanceFeesFine:auth_panel",
        "balanceFeesFine:validate_dtls": "balanceFeesFine:validate_dtls",
        "balanceFeesFine": "balanceFeesFine",
        "balanceFeesFine:tf_reg_no": vnum,
        "balanceFeesFine:tf_chasis_no": last5,
        "javax.faces.ViewState": vs,
      })
    });
    const body = await r9.text();

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

function mergeData(rcData: any, parivahanData: any) {
  const data = rcData?.data || {};
  
  const merged: any = {
    status: "success",
    source: "91Wheels + Parivahan (Merged)",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    vehicle_number: rcData?.regNo || data?.rc_number,
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
// ROOTX API
// =====================================================================

async function rootxRequest(type: string, query: string) {
  try {
    const response = await fetch(`https://rootx-osint.in/?type=${type}&key=seed_bhai&query=${query}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    return await response.json();
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// UPI / AMAZON PAY API
// =====================================================================

async function getUpiInfo(vpa: string) {
  try {
    const response = await fetch("https://www.amazon.in/apay/money-transfer/verify-vpa/v2", {
      method: "POST",
      headers: {
        "User-Agent": "Amazon.com/30.22.0.300 (Android/15/V2509)",
        "Content-Type": "application/json; charset=utf-8",
        "Origin": "https://www.amazon.in",
        "Referer": "https://www.amazon.in/apay/money-transfer/assets/ap4-eap/index.html",
        "Cookie": "session-id=259-7081962-2819512; session-token=VpKpW0kkLbYhCoH1IhYgmDkVGerV0YsBvBnJhU+htecJbmO/H63b5h47CLNlcmJKqGchAMtJc6MogIeX1VrPksfceSO2yaFeJIyNNnWBdIh6lzAnkTvb6AzWCFsRhM7D/5aDvO1TuJWeOLgw6O5Ub0ufrA41u3eoWKwi4cpH+DzA28S0eriPIT6a4+zKHYT5aeFAlWd62sv8sy54SY4F/OvI/FOvDv8KlLOC2z3DN4FNsCZod3IqtRbYr8vmruH8mx+oSrz+y5FK9sh+lJmbXrU1y6j4UfasRr2sb3qTEkeRCWuS1+ualjstAre1Tn+nBNCKkD5GcsIPcQOGNE8kBlhWi7WieKjewdGS6bhp03XFSUkxpg2MIUspWD8xDk7Q"
      },
      body: JSON.stringify({
        recipientVpa: vpa,
        clientContext: { pageType: "EAP", useCase: "SEND_MONEY" }
      })
    });
    return await response.json();
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// =====================================================================
// HANDLER
// =====================================================================

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams;
  const parts = path.split('/').filter(p => p);
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  
  // =============================================================
  // HOME
  // =============================================================
  if (parts.length === 0) {
    return new Response(JSON.stringify({
      service: "MR SHREY API Gateway",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      version: "3.0",
      endpoints: {
        "/vehicle": { method: "GET", params: { regNumber: "Required" }, example: "/vehicle?regNumber=MH12DE1433" },
        "/vehicle/phone": { method: "GET", params: { regNumber: "Required" }, example: "/vehicle/phone?regNumber=MH12DE1433" },
        "/rootx/vehicle/<rc>": { method: "GET", example: "/rootx/vehicle/MH12DE1433" },
        "/rootx/number/<phone>": { method: "GET", example: "/rootx/number/9876543210" },
        "/rootx/aadhar/<id>": { method: "GET", example: "/rootx/aadhar/123456789012" },
        "/upi/<vpa>": { method: "GET", example: "/upi/example@axl" },
        "/pan/<pan>": { method: "GET", params: { api_key: "Required" }, example: "/pan/JCZPS4827P?api_key=MR_SHREY_MONTHLY_001" },
        "/keyinfo/<api_key>": { method: "GET", example: "/keyinfo/MR_SHREY_MONTHLY_001" }
      },
      available_plans: {
        "1 Month": { key: "MR_SHREY_MONTHLY_001", daily_limit: 1000 },
        "2 Months": { key: "MR_SHREY_2MONTH_001", daily_limit: 2000 },
        "3 Months": { key: "MR_SHREY_3MONTH_001", daily_limit: 3000 },
        "Master (1 Year)": { key: "MR_SHREY_MASTER_001", daily_limit: 10000 }
      }
    }, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // KEY INFO
  // =============================================================
  if (parts[0] === "keyinfo" && parts.length === 2) {
    const apiKey = parts[1];
    const keyInfo = getKeyInfo(apiKey);
    return new Response(JSON.stringify({
      status: keyInfo ? "success" : "error",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      key_info: keyInfo || "Invalid API Key!"
    }, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // VEHICLE (91Wheels + Parivahan Merged)
  // =============================================================
  if (parts[0] === "vehicle" && parts.length === 1) {
    const reg = params.get('regNumber');
    if (!reg) {
      return new Response(JSON.stringify({ status: "error", message: "Missing 'regNumber' parameter" }), { status: 400, headers });
    }
    
    const regClean = reg.trim().toUpperCase().replace(/[\s-]/g, '');
    
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(regClean)) {
      return new Response(JSON.stringify({ status: "error", message: "Invalid format. Example: MH12AB1234" }), { status: 400, headers });
    }
    
    const rcData = await get91WheelsData(regClean);
    
    if (rcData.status === "error") {
      return new Response(JSON.stringify({
        status: "error",
        message: "91Wheels fetch failed",
        error_detail: rcData.message
      }), { status: 500, headers });
    }
    
    const data = rcData.data || {};
    const chassis = data.vehicle_chasi_number;
    let parivahanData = null;
    
    if (chassis) {
      const chassisClean = chassis.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const chassisLast5 = chassisClean.length >= 5 ? chassisClean.slice(-5) : chassisClean;
      parivahanData = await fetchParivahanMobile(regClean, chassisLast5);
    }
    
    const merged = mergeData(rcData, parivahanData);
    return new Response(JSON.stringify(merged, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // VEHICLE PHONE ONLY
  // =============================================================
  if (parts[0] === "vehicle" && parts[1] === "phone") {
    const reg = params.get('regNumber');
    if (!reg) {
      return new Response(JSON.stringify({ status: "error", message: "Missing 'regNumber' parameter" }), { status: 400, headers });
    }
    
    const regClean = reg.trim().toUpperCase().replace(/[\s-]/g, '');
    const rcData = await get91WheelsData(regClean);
    
    if (rcData.status === "error") {
      return new Response(JSON.stringify({ status: "error", message: "91Wheels fetch failed" }), { status: 500, headers });
    }
    
    const data = rcData.data || {};
    const chassis = data.vehicle_chasi_number;
    
    if (!chassis) {
      return new Response(JSON.stringify({ status: "error", message: "Chassis number not found" }), { status: 404, headers });
    }
    
    const chassisClean = chassis.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chassisLast5 = chassisClean.length >= 5 ? chassisClean.slice(-5) : chassisClean;
    const result = await fetchParivahanMobile(regClean, chassisLast5);
    
    return new Response(JSON.stringify({
      status: result.status,
      registration_number: regClean,
      chassis_last5: chassisLast5,
      mobile: result.mobile || null,
      message: result.message || null
    }, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // ROOTX APIs (Free - No API Key Required)
  // =============================================================
  
  // RootX Vehicle
  if (parts[0] === "rootx" && parts[1] === "vehicle" && parts.length === 3) {
    const data = await rootxRequest("v_num", parts[2]);
    return new Response(JSON.stringify({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      source: "RootX",
      data: data
    }, null, 2), { status: 200, headers });
  }
  
  // RootX Number
  if (parts[0] === "rootx" && parts[1] === "number" && parts.length === 3) {
    const data = await rootxRequest("num", parts[2]);
    return new Response(JSON.stringify({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      source: "RootX",
      data: data
    }, null, 2), { status: 200, headers });
  }
  
  // RootX Aadhar
  if (parts[0] === "rootx" && parts[1] === "aadhar" && parts.length === 3) {
    const data = await rootxRequest("aadhar_fam_v2", parts[2]);
    return new Response(JSON.stringify({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      source: "RootX",
      data: data
    }, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // UPI INFO
  // =============================================================
  if (parts[0] === "upi" && parts.length === 2) {
    const data = await getUpiInfo(parts[1]);
    return new Response(JSON.stringify({
      status: "success",
      developer: "MR SHREY",
      channel: "https://t.me/MR_SHREY3",
      source: "Amazon Pay",
      data: data
    }, null, 2), { status: 200, headers });
  }
  
  // =============================================================
  // PAN INFO (API Key Required)
  // =============================================================
  if (parts[0] === "pan" && parts.length === 2) {
    const pan = parts[1];
    const apiKey = params.get('api_key');
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        status: "error",
        message: "❌ API Key Required!",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }), { status: 400, headers });
    }
    
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        status: "error",
        message: validation.error,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }), { status: 403, headers });
    }
    
    try {
      const response = await fetch(
        `https://turtlemintloans.com/api/minterprise/v1/products/personal-loan/leads/existing-lead-by-pan?pan=${pan}`,
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
      
      return new Response(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        key_info: keyInfo,
        data: data
      }, null, 2), { status: 200, headers });
    } catch (error) {
      return new Response(JSON.stringify({
        status: "error",
        message: error.message,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }), { status: 500, headers });
    }
  }
  
  // =============================================================
  // 404
  // =============================================================
  return new Response(JSON.stringify({
    status: "error",
    message: "Endpoint not found",
    developer: "MR SHREY",
    channel: "https://t.me/MR_SHREY3",
    available: [
      "/vehicle?regNumber=...",
      "/vehicle/phone?regNumber=...",
      "/rootx/vehicle/<rc>",
      "/rootx/number/<phone>",
      "/rootx/aadhar/<id>",
      "/upi/<vpa>",
      "/pan/<pan>?api_key=...",
      "/keyinfo/<api_key>"
    ]
  }, null, 2), { status: 404, headers });
}

// =====================================================================
// SERVER START
// =====================================================================

serve(handler, { port: 8000 });

console.log("🚀 MR SHREY API Server running on http://localhost:8000");
console.log("👨‍💻 Developer: MR SHREY");
console.log("📢 Channel: https://t.me/MR_SHREY3");
console.log("📌 Endpoints:");
console.log("  /vehicle?regNumber=...     → 91Wheels + Parivahan Merged");
console.log("  /vehicle/phone?regNumber=... → Only Phone Number");
console.log("  /rootx/vehicle/<rc>        → RootX Vehicle");
console.log("  /rootx/number/<phone>      → RootX Number");
console.log("  /rootx/aadhar/<id>         → RootX Aadhar");
console.log("  /upi/<vpa>                 → UPI Info");
console.log("  /pan/<pan>?api_key=...    → PAN Info");
console.log("  /keyinfo/<api_key>        → Key Info");
