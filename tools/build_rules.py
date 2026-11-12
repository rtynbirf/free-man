#!/usr/bin/env python3
"""data/domains.json -> rules/{trackers,ads,widgets}.json (one DNR rule per domain, subdomains included)."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
doms = json.load(open(root/"data/domains.json", encoding="utf-8"))
ids = [d["id"] for d in doms]; assert len(ids) == len(set(ids))
for tier in ("trackers", "ads", "widgets"):
    rules = [{"id": d["id"], "priority": 1, "action": {"type": "block"},
              "condition": {"requestDomains": [d["domain"]], "domainType": "thirdParty"}}
             for d in doms if d["tier"] == tier]
    json.dump(rules, open(root/f"rules/{tier}.json", "w"), indent=1)
    print(tier, len(rules))
