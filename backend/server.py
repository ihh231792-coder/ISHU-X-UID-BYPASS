# ============================================================
# DISCORD REAL VERIFICATION BACKEND
#  Ye server aapke VPS/host pe chalao (fi9.bot-hosting.cloud).
#  Frontend (signup page) isse poochta hai: kya ye user
#  sach me aapke Discord server ka member hai?
#  100% real check — bot se member list verify hoti hai.
# ============================================================
# SETUP (ek baar karna padega):
#  1) https://discord.com/developers/applications -> New Application
#     -> Bot -> Reset Token -> copy karo (ye DISCORD_BOT_TOKEN)
#     -> PRIVILEGED GATEWAY INTENTS me "SERVER MEMBERS INTENT" ON karo
#  2) Bot ko apne server me add karo:
#     OAuth2 -> URL Generator -> scope "bot" -> bot permissions
#     minimum "View Channels" -> open URL -> add bot
#  3) Discord server ka ID lo (server name par right-click -> Copy Server ID,
#     Discord Settings -> Advanced -> Developer Mode ON karna padega)
#  4) Ye env vars set karke chalalo:
#        set DISCORD_BOT_TOKEN=PASTE_TOKEN
#        set DISCORD_GUILD_ID=PASTE_SERVER_ID
#        set PORT=8081
#        python server.py
#  5) Frontend me js/config.js -> taskGate.backend.url me apna public URL daalo.
#     NOTE: GitHub Pages HTTPS hai, isliye backend bhi HTTPS hona chahiye
#     (bot-hosting wale host pe https milega to best; warna reverse proxy).
# ============================================================

import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # site kahin bhi hosted ho, isse verify ho sakta hai

BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
GUILD_ID = os.environ.get("DISCORD_GUILD_ID", "").strip()


def fetch_members():
    """Bot se guild ke saare members lao (paginated)."""
    if not BOT_TOKEN or not GUILD_ID:
        return None, "not_configured"
    headers = {"Authorization": f"Bot {BOT_TOKEN}"}
    members = []
    after = None
    while True:
        url = f"https://discord.com/api/v10/guilds/{GUILD_ID}/members?limit=1000"
        if after:
            url += f"&after={after}"
        try:
            r = requests.get(url, headers=headers, timeout=10)
        except Exception as e:
            return None, f"network_error: {e}"
        if r.status_code != 200:
            return None, f"http_{r.status_code}: {r.text[:200]}"
        batch = r.json()
        members.extend(batch)
        if len(batch) < 1000:
            break
        after = batch[-1]["user"]["id"]
    return members, "ok"


@app.post("/api/verify_discord")
def verify_discord():
    data = request.get_json(silent=True) or {}
    tag = str(data.get("tag", "")).strip()
    if not tag:
        return jsonify({"joined": False, "error": "tag required"}), 400

    members, status = fetch_members()
    if status != "ok":
        return jsonify({"joined": False, "error": status}), 502

    tag_low = tag.lower()
    for m in members:
        u = m.get("user", {}) or {}
        username = (u.get("username") or "").lower()
        full = f"{username}#{u.get('discriminator', '0')}"
        uid = str(u.get("id", ""))
        if username == tag_low or full.lower() == tag_low or uid == tag_low:
            return jsonify({
                "joined": True,
                "member": u.get("username"),
                "id": uid
            })
    return jsonify({"joined": False, "member": None})


@app.get("/api/ping")
def ping():
    return jsonify({"ok": True, "bot": bool(BOT_TOKEN), "guild": bool(GUILD_ID)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8081)))
