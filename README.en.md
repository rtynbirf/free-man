# FREE MAN — Browser Autonomy (Chrome MV3)

**Local-first tracker blocking for Chrome. No account, no server, no telemetry, no content scripts, no remote lists.**

[Русский](README.md) | English

![rules-lint](https://github.com/rtynbirf/free-man/actions/workflows/rules-lint.yml/badge.svg)
![release](https://img.shields.io/github/v/release/rtynbirf/free-man)
![license](https://img.shields.io/github/license/rtynbirf/free-man)

## What is this

FREE MAN is a Chrome (MV3) extension that blocks 108 tracker, ads and CNAME-cloaked
domains **entirely on-device** via declarativeNetRequest. Nothing about your browsing
ever leaves your machine: the blocklist ships inside the extension, counting happens
locally, and there is no backend to talk to — by design, not by policy.

| | |
|---|---|
| Blocked domains | **108** (trackers 48 / ads 30 / widgets 14 / cname 16) |
| Modes | Off / **Basic** (trackers + cname, 64) / **Strict** (+ads +widgets, 108) |
| CNAME cloaking | vendors masquerading behind client hostnames are blocked |
| Site pause | 1 hour or forever, per site (dynamic allow-rule with expiry) |
| Counter | live badge + per-tab list of blocked domains (`getMatchedRules`) |
| Site data wipe | cookies, localStorage, IndexedDB, Cache Storage, SWs — per origin |
| GPC | `Sec-GPC: 1` signal, optional; <all_urls> only while enabled |
| Guide | built-in "7-day plan" page: Brave/Firefox hardening, NextDNS/Pi-hole/uBlock export |

## Install

The repository root **is** the extension (`manifest.json` on top level).

- **From a release:** grab `free-man-0.2.2.zip` from [Releases](https://github.com/rtynbirf/free-man/releases), unpack.
- **From GitHub:** Code → Download ZIP → unpack.
- **Via git:** `git clone https://github.com/rtynbirf/free-man.git`

Then: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the unpacked folder.

## Why local-first

- The blocklist is generated from a single source (`data/domains.json`) and compiled
  to static `rules/*.json` by `tools/build_rules.py` — reproducible, auditable, CI-enforced
  (the `rules-lint` gate rebuilds and diffs on every change).
- The cname tier is sourced from AdGuard's public `cname-trackers` list — canonical
  CNAME-cloaking targets, kept in a separate ruleset.
- The same 108 domains export as NextDNS / Pi-hole / uBlock Origin blocklists
  from the guide page — protect DNS-level and other browsers too.

## Permissions

`storage`, `declarativeNetRequest`, `declarativeNetRequestFeedback`, `activeTab`,
`alarms`, `browsingData`, `clipboardWrite`; `<all_urls>` is **optional** and only used
for the GPC signal — requested on enable, revoked on disable.

## Honest boundaries

Not an anti-fingerprinting tool, not an anonymizer. Server-side message counters
will still see your accounts; clearing site data logs you out and cannot touch
server-side history.

## Project

- [CHANGELOG.md](CHANGELOG.md) — full history (0.2.2: blocklist 72 → 108 domains, new cname tier)
- [README.md](README.md) — the full document in Russian
- Releases ship the extension zip plus the companion PDF plan (в 7-дневный план цифрового самоосвобождения)

## License

See [LICENSE](LICENSE).
