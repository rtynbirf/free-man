const DAYS = [
  ["Браузер: FREE MAN в Chrome (или Brave / Firefox + uBlock Origin по разделу 1)", "30 мин"],
  ["Сеть: NextDNS — вставить список, включить защиты, подключить устройства", "20 мин"],
  ["Переключатели отказа от обучения по таблице 3 на всех сервисах", "20 мин"],
  ["FREE MAN: выбрать режим, ставить паузу только на сломанных сайтах, посмотреть счётчики", "15 мин"],
  ["Алиасы почты, чистка старых чатов, обезличенные профили", "30 мин"],
  ["Локальная модель (Ollama) для чувствительных задач", "60 мин"],
  ["Проверка по разделу 5 и пересмотр набора сервисов", "20 мин"]
];
const $ = s => document.querySelector(s);
(async () => {
  const { done = {} } = await chrome.storage.local.get("done");
  const ol = $("#days");
  DAYS.forEach(([t, time], i) => {
    const li = document.createElement("li"), lab = document.createElement("label"), cb = document.createElement("input"), sp = document.createElement("span");
    cb.type = "checkbox"; cb.checked = !!done[i]; sp.textContent = " День " + (i + 1) + ". " + t;
    cb.addEventListener("change", async () => { const d = (await chrome.storage.local.get("done")).done || {}; d[i] = cb.checked; await chrome.storage.local.set({ done: d }); });
    lab.append(cb, sp); const tm = document.createElement("span"); tm.className = "t"; tm.textContent = time; li.append(lab, tm); ol.append(li);
  });

  const D = await (await fetch("data/domains.json")).json();
  $("#cnt").textContent = "— " + D.length + " доменов";
  const groups = {};
  for (const d of D) (groups[d.tier + "|" + d.owner + "|" + d.category] ||= []).push(d.domain);
  const tb = $("#dom tbody");
  for (const [k, v] of Object.entries(groups)) {
    const tr = document.createElement("tr");
    for (const x of [...k.split("|"), v.join(", ")]) { const td = document.createElement("td"); td.textContent = x; tr.append(td); }
    tb.append(tr);
  }
  const text = f => D.map(d => f(d.domain)).join("\n") + "\n";
  document.querySelectorAll("[data-export]").forEach(b => b.addEventListener("click", async () => {
    const k = b.dataset.export;
    if (k === "copy") { await navigator.clipboard.writeText(text(x => x)); $("#exp").textContent = "Скопировано " + D.length + " доменов."; return; }
    const blob = new Blob([text(k === "ubo" ? x => "||" + x + "^" : x => x)], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = k === "ubo" ? "free-man-ublock.txt" : "free-man-denylist.txt"; a.click();
    $("#exp").textContent = "Файл сохранён.";
  }));
})();
