# CHANGELOG

Формат: версии сверху вниз. Даты — по коммитам.

## 0.2.2 — 2026-11-15

- Блок-лист 72 -> 108 доменов:
  - +6 трекеров: plausible.io, chartbeat.com, snowplow.io, crazyegg.com, mouseflow.com, inspectlet.com;
  - +7 рекламных: adform.net, adroll.com, adition.com, sonobi.com, bkrtx.com, indexww.com, zedo.com;
  - +7 виджетов: tawk.to, zdassets.com, crisp.chat, drift.com, disqus.com, uservoice.com, olark.com.
- Новый тир **cname** (16 доменов) — канонические цели CNAME-клоакинга (Adobe edge/dnsdelegation, AT Internet, Commanders Act, Act-On, EBiS, A8, AdOcean, Storetail, DataUnlocker, Ad-Shield, Datafast, 1p-data.co, ESP delivery, Aqua). Источник — публичный список AdGuard `cname-trackers` (отобрано из `combined_original_trackers_justdomains.txt`). В браузере блокируются прямые обращения к вендорам; замаскированные хосты закрываются на DNS-уровне через экспорт в guide.
- Новый ruleset `rules/cname.json`; **Базовый** режим = trackers + cname (64 домена), **Строгий** = все 108.
- CI: восстановлен `rules-lint` — пересборка `tools/build_rules.py` + diff-приёмка биекции (триггер исправлен против роевого `.yml`).
- `SECURITY.md` — политика приватных репортов; `CHANGELOG.md` — заведён; скриншоты popup/guide — в README; canonfix-zip приложен к релизу v0.2.1.

## 0.2.1 — 2026-11-12

- manifest: +`declarativeNetRequestFeedback` — без него `getMatchedRules()` отклонялся и список доменов на вкладке молча показывал ноль; +`clipboardWrite` для кнопки «Копировать список».
- PDF-план вынесен из git в Release-ассет (бинарники >100 КБ в репозиторий не ходят).
