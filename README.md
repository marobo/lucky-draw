# Lucky Draw

A small workshop app: each participant scans a QR code, taps **Draw a concept**, and gets one unique concept. The page color shows the category so you can see themes at a glance.

Built for the MOVE Entrepreneurship Workshop (Catalpa International).

## How it works

There are **35 concepts** (7 in each of 5 categories). Each concept can be drawn only once. The server remembers a participant by **IP address**, so reloading the page keeps their result. Restarting the server clears all draws.

| Category | Color |
| --- | --- |
| Timor-Leste | Green |
| Entrepreneurship | Blue |
| Youth | Orange |
| Sustainability | Yellow |
| Health | Teal |

## Workshop flow

1. **Concept Drawing**
   - Participants click the "PICK A COLOR" button
   - They receive a unique concept with a color-coded background
   - The concept stays with them even if they reload the page
   - Each IP address can only draw once until the server restarts

2. **Configure and start the server** (see [Setup](#setup)).
3. **Connect phones to Wi‑Fi** — open `/wifi` on the laptop and let people scan that QR code. Skip this if everyone is already on the same network.
4. **Open the app** — open `/qr` and share that QR code. It points to the draw page.
5. **Participants draw** — they tap the button once and keep their concept.
6. **Watch progress** — open `/monitor` on a projector or second screen. Draws appear live. There is no login; treat it as a room-only page.

## Setup

You need Node.js and npm (Node 18 or newer is a safe choice).

```bash
git clone https://github.com/marobo/lucky-draw.git
cd lucky-draw
npm install
```

Copy the example config to `.env` and edit it:

```bash
cp .env.example.yaml .env
```

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port. Default: `3000`. |
| `HOST` | Address used in the **app QR code**. Set this to your laptop’s **LAN IP** (for example `192.168.1.42`), not `localhost`, or phones cannot open the app. |
| `WIFI_SSID` | Workshop Wi‑Fi name. Required to generate the Wi‑Fi QR code. |
| `WIFI_PASSWORD` | Workshop Wi‑Fi password. |
| `WIFI_ENCRYPTION` | `WPA` (usual), `WEP`, or empty for an open network. |

Start the server:

```bash
node index.js
```

In the terminal you will see URLs such as `http://YOUR_HOST:3000`. Use those on the laptop; participants should use the QR codes.

## Pages

Replace `HOST` and `PORT` with your values (for example `http://192.168.1.42:3000`).

| URL | Who uses it | What it is |
| --- | --- | --- |
| `/` | Participants | Draw a concept (one draw per IP). |
| `/wifi` | Facilitator | Wi‑Fi join QR code. Missing if SSID/password are not set. |
| `/qr` | Facilitator | App URL QR code. |
| `/monitor` | Facilitator | Live list of draws, category counts, remaining concepts. |
| `/test` | Facilitator | Practice draws. **This uses the same concept pool as the real draw.** Reset by restarting the server before the workshop starts. |

## Good to know

- One draw per device IP until the server restarts. Shared NAT (some guest networks) can make several people look like one IP.
- Draws are stored in memory only. A restart wipes results and restores the full concept list.
- `/monitor` is not password-protected. Use it on the workshop network, not on a public internet host.

## License

MIT. See [LICENSE](LICENSE).
