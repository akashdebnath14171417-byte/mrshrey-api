// =====================================================================
// SIMPLIFIED VERSION - Remove Parivahan temporarily
// =====================================================================

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const parts = path.split('/').filter(p => p);
  
  // =============================================================
  // VEHICLE - 91Wheels Only (No Parivahan)
  // =============================================================
  if (parts[0] === "vehicle" && parts.length === 1) {
    const reg = url.searchParams.get('regNumber');
    if (!reg) {
      return new Response(JSON.stringify({ 
        status: "error", 
        message: "Missing 'regNumber' parameter" 
      }), { status: 400 });
    }
    
    const regClean = reg.trim().toUpperCase().replace(/[\s-]/g, '');
    
    try {
      const sessionId = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch("https://api1.91wheels.com/api/v1/third/rc-detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://www.91wheels.com",
          "Referer": "https://www.91wheels.com/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
        },
        body: JSON.stringify({ 
          regNo: regClean, 
          sessionid: sessionId 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      return new Response(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        data: data
      }, null, 2), { status: 200 });
      
    } catch (error) {
      return new Response(JSON.stringify({
        status: "error",
        message: error.message,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }), { status: 500 });
    }
  }
  
  // =============================================================
  // ROOTX APIs (Fast)
  // =============================================================
  if (parts[0] === "rootx" && parts.length === 3) {
    const type = parts[1];
    const query = parts[2];
    
    const typeMap: Record<string, string> = {
      "vehicle": "v_num",
      "number": "num",
      "aadhar": "aadhar_fam_v2"
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://rootx-osint.in/?type=${typeMap[type] || type}&key=seed_bhai&query=${query}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      return new Response(JSON.stringify({
        status: "success",
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3",
        source: "RootX",
        data: data
      }, null, 2), { status: 200 });
      
    } catch (error) {
      return new Response(JSON.stringify({
        status: "error",
        message: error.message,
        developer: "MR SHREY",
        channel: "https://t.me/MR_SHREY3"
      }), { status: 500 });
    }
  }
  
  // ... rest of the code
}
