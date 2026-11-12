const $ = s => document.querySelector(s);
const buttons = [...document.querySelectorAll(".mode")];
const say = t => { $("#message").textContent = t || ""; };
let tab = null, host = null, state = null, DOMAINS = [];
const bg = msg => chrome.runtime.sendMessage(msg).then(r => { if (!r?.ok) throw new Error(r?.error || "ошибка"); return r; });

function showMode(mode) {
  buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  $("#status").textContent = mode === "off" ? "ПАУЗА" : mode === "strict" ? "СТРОГИЙ" : "АКТИВЕН";
}
function showSite() {
  const exp = host && state?.paused?.[host];
  const isPaused = host && exp !== undefined;
  $("#pause1h").hidden = $("#pauseAlways").hidden = !!isPaused || !host;
  $("#resume").hidden = !isPaused;
  $("#wipe").hidden = !host;
  $("#host").textContent = host ? host + (isPaused ? (exp ? " — пауза до " + new Date(exp).toLocaleTimeString() : " — пауза навсегда") : "") : "Служебная страница — нет сайта";
}
async function showBlocked() {
  $("#top").textContent = ""; $("#blocked").textContent = "0";
  if (!tab) return;
  try {
    const { rulesMatchedInfo } = await chrome.declarativeNetRequest.getMatchedRules({ tabId: tab.id });
    const byId = new Map(DOMAINS.map(d => [d.id, d.domain])), c = {};
    for (const m of rulesMatchedInfo) { const d = byId.get(m.rule.ruleId); if (d) c[d] = (c[d] || 0) + 1; }
    $("#blocked").textContent = Object.values(c).reduce((a, b) => a + b, 0);
    for (const [d, n] of Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      const li = document.createElement("li"); li.innerHTML = "<span></span><b></b>";
      li.firstChild.textContent = d; li.lastChild.textContent = n; $("#top").append(li);
    }
  } catch (e) { /* internal pages: no data */ }
}
async function refresh() {
  state = await bg({ type: "GET_STATE" });
  showMode(state.mode); $("#gpc").checked = state.gpc; showSite();
}
async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { const u = new URL(tab.url); if (/^https?:$/.test(u.protocol)) host = u.hostname; } catch {}
  DOMAINS = await (await fetch("data/domains.json")).json();
  await refresh(); await showBlocked();
}
buttons.forEach(b => b.addEventListener("click", async () => {
  try { await bg({ type: "SET_MODE", mode: b.dataset.mode }); await refresh(); say("Режим применён. Обновите вкладку."); } catch (e) { say(e.message); }
}));
const pause = minutes => async () => { try { await bg({ type: "PAUSE_SITE", host, minutes }); await refresh(); say("Защита для сайта приостановлена. Обновите вкладку."); } catch (e) { say(e.message); } };
$("#pause1h").addEventListener("click", pause(60));
$("#pauseAlways").addEventListener("click", pause(0));
$("#resume").addEventListener("click", async () => { try { await bg({ type: "RESUME_SITE", host }); await refresh(); say("Защита возвращена."); } catch (e) { say(e.message); } });
$("#wipe").addEventListener("click", async () => {
  if (!host || !confirm("Стереть cookies, localStorage, IndexedDB и кэш для " + new URL(tab.url).origin + "?\nВы будете разлогинены. История на сервере сервиса останется.")) return;
  try {
    await chrome.browsingData.remove({ origins: [new URL(tab.url).origin] },
      { cache: true, cacheStorage: true, cookies: true, fileSystems: true, indexedDB: true, localStorage: true, serviceWorkers: true, webSQL: true });
    say("Данные сайта стёрты. Cookies поддоменов могут остаться.");
  } catch (e) { say("Ошибка: " + e.message); }
});
$("#gpc").addEventListener("change", async ev => {
  const want = ev.target.checked;
  try {
    if (want && !(await chrome.permissions.request({ origins: ["<all_urls>"] }))) throw new Error("Разрешение не выдано — GPC не включён.");
    await bg({ type: "SET_GPC", enabled: want });
    if (!want) await chrome.permissions.remove({ origins: ["<all_urls>"] });
    say(want ? "GPC включён." : "GPC выключен, разрешение отозвано.");
  } catch (e) { ev.target.checked = !want; say(e.message); }
});
init().catch(e => say(String(e)));
