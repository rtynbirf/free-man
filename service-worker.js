const DEFAULT_MODE = "balanced";
const ALL_SETS = ["trackers", "ads", "widgets"];
const MODE_SETS = { off: [], balanced: ["trackers"], strict: ["trackers", "ads", "widgets"] };
const PAUSE_BASE = 10000;   // dynamic allow-rules: per-site pause
const GPC_RULE_ID = 9000;   // dynamic rule: Sec-GPC header (needs optional host permission)
const ALL_TYPES = ["main_frame","sub_frame","stylesheet","script","image","font","object","xmlhttprequest","ping","csp_report","media","websocket","other"];

async function applyMode(mode) {
  const on = MODE_SETS[mode];
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: on,
    disableRulesetIds: ALL_SETS.filter(id => !on.includes(id))
  });
  await chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: mode !== "off" });
  await chrome.storage.local.set({ mode, lastChangedAt: new Date().toISOString() });
}

// ---- per-site pause: dynamic "allow" rules scoped to the initiator site ----
async function getPaused() {
  const { paused = {} } = await chrome.storage.local.get("paused");
  const now = Date.now();
  let changed = false;
  for (const [h, exp] of Object.entries(paused)) if (exp && exp <= now) { delete paused[h]; changed = true; }
  if (changed) await chrome.storage.local.set({ paused });
  return paused;
}
async function syncDynamic() {
  const paused = await getPaused();
  const { gpc = false } = await chrome.storage.local.get("gpc");
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  const add = Object.keys(paused).map((host, i) => ({
    id: PAUSE_BASE + i, priority: 100, action: { type: "allow" },
    condition: { initiatorDomains: [host] }
  }));
  if (gpc) add.push({
    id: GPC_RULE_ID, priority: 1,
    action: { type: "modifyHeaders", requestHeaders: [{ header: "Sec-GPC", operation: "set", value: "1" }] },
    condition: { resourceTypes: ALL_TYPES }
  });
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id), addRules: add });
  for (const [host, exp] of Object.entries(paused)) if (exp) chrome.alarms.create("pause:" + host, { when: exp });
}
const validHost = h => typeof h === "string" && /^[a-z0-9.-]+$/i.test(h) && h.includes(".");

chrome.runtime.onInstalled.addListener(async () => {
  const s = await chrome.storage.local.get(["mode"]);
  await applyMode(s.mode || DEFAULT_MODE);
  await syncDynamic();
});
chrome.runtime.onStartup.addListener(syncDynamic);
chrome.alarms.onAlarm.addListener(a => { if (a.name.startsWith("pause:")) syncDynamic(); });

chrome.runtime.onMessage.addListener((m, _s, reply) => {
  const run = p => { p.then(r => reply({ ok: true, ...r })).catch(e => reply({ ok: false, error: String(e) })); return true; };
  switch (m?.type) {
    case "SET_MODE":
      if (!(m.mode in MODE_SETS)) return;
      return run(applyMode(m.mode).then(() => ({ mode: m.mode })));
    case "GET_STATE":
      return run((async () => {
        const s = await chrome.storage.local.get(["mode", "gpc"]);
        return { mode: s.mode || DEFAULT_MODE, gpc: !!s.gpc, paused: await getPaused(),
                 enabledRulesets: await chrome.declarativeNetRequest.getEnabledRulesets() };
      })());
    case "PAUSE_SITE":
      if (!validHost(m.host)) return;
      return run((async () => {
        const paused = await getPaused();
        paused[m.host] = m.minutes > 0 ? Date.now() + m.minutes * 60000 : 0; // 0 = until resumed
        await chrome.storage.local.set({ paused }); await syncDynamic(); return { paused };
      })());
    case "RESUME_SITE":
      return run((async () => {
        const paused = await getPaused(); delete paused[m.host];
        await chrome.storage.local.set({ paused }); await syncDynamic(); return { paused };
      })());
    case "SET_GPC":
      return run((async () => { await chrome.storage.local.set({ gpc: !!m.enabled }); await syncDynamic(); return { gpc: !!m.enabled }; })());
  }
});
