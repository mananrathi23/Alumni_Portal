# Deploying the backend on Oracle Cloud Always Free

Everything here is free: Oracle Always Free VM (backend + Redis + Nginx),
MongoDB Atlas M0 (database), Vercel Hobby (frontend), DuckDNS (domain),
Let's Encrypt (HTTPS). Free-tier limits change, so check each provider's current
terms when you sign up.

```
Browser ──► Vercel (React app)
   │
   └──► https://<you>.duckdns.org ──► Oracle VM: Nginx ──► backend ×2 ──► MongoDB Atlas
                                                     └──► Redis
```

## 1. Create the VM

1. Sign up at <https://www.oracle.com/cloud/free/>. A card is required for
   verification; Always Free resources are not charged.
2. **Compute → Instances → Create instance**
   - Image: **Ubuntu 24.04** (or 22.04)
   - Shape: **Ampere (VM.Standard.A1.Flex)**, 2 OCPU / 12 GB RAM is plenty
     (Always Free allows up to 4 OCPU / 24 GB in total).
     If you get "out of capacity", try another availability domain or retry later.
   - Networking: keep "Assign a public IPv4 address" on.
   - SSH keys: download the private key.
3. Note the VM's **public IP**.

## 2. Open ports 80 and 443

Oracle has **two** firewalls; both must allow the traffic.

1. Cloud side: **Instance → Subnet → Security List → Add Ingress Rules**:
   source `0.0.0.0/0`, TCP, destination ports `80` and `443`.
2. On the VM (Ubuntu images ship with iptables rules that block everything else):

```bash
ssh -i <key> ubuntu@<public-ip>
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Free domain (DuckDNS)

Let's Encrypt needs a domain name. At <https://www.duckdns.org> sign in, create a
subdomain (e.g. `alumni-api`) and set its IP to the VM's public IP.
Your API is now `alumni-api.duckdns.org`.

## 4. Install Docker on the VM

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit   # log out and back in so the group change applies
```

## 5. Copy the code to the VM

From your Mac, in the repo root:

```bash
rsync -av --exclude node_modules --exclude .env --exclude 'backend/.env' \
  --exclude 'frontend/.env' --exclude dist ./ ubuntu@<public-ip>:~/alumni-portal/
```

(Or `git clone` if the repo is on GitHub.)

## 6. Configure secrets on the VM

```bash
cd ~/alumni-portal
cp .env.example .env
cp backend/.env.example backend/.env
openssl rand -hex 32   # use as REDIS_PASSWORD in .env
openssl rand -hex 64   # use as JWT_SECRET_KEY in backend/.env
nano .env
nano backend/.env
```

In `backend/.env` set at least:

| Key | Value |
|---|---|
| `MONGO_URI` | Atlas connection string (**use a new password**; the old one was committed in docker-compose.yml) |
| `JWT_SECRET_KEY` | the new 64-byte hex value (logs everyone out once) |
| `FRONTEND_URL` | your Vercel URL, e.g. `https://alumni-portal.vercel.app` (no trailing slash) |
| `BACKEND_URL` | `https://alumni-api.duckdns.org` |
| `MONGO_MAX_POOL` | `20` (2 replicas → ~40 Atlas connections; M0 allows 500) |
| SMTP / Cloudinary / Google / LinkedIn / Gemini | copy from your current setup |

The `REDIS_*` values in `backend/.env` are ignored in production; Compose
points the API at its own Redis container.

## 7. Allow the VM in MongoDB Atlas

Atlas → **Network Access → Add IP Address** → the VM's public IP.
Without this the backend never becomes healthy and Nginx won't start.

## 8. Start everything + get the HTTPS certificate

```bash
cd ~/alumni-portal
# Optional dry run against Let's Encrypt staging first:
./deploy/init-letsencrypt.sh alumni-api.duckdns.org you@example.com --staging
# Real certificate:
./deploy/init-letsencrypt.sh alumni-api.duckdns.org you@example.com
curl https://alumni-api.duckdns.org/api/v1/health
```

The health response should show `mongodb` and `redis` both `ok: true`.
The certificate renews automatically (the `certbot` service checks every 12 h,
Nginx reloads every 6 h).

## 9. Point the frontend at the new backend

Vercel → Project → **Settings → Environment Variables** (Production):

```
VITE_BACKEND_URL=https://alumni-api.duckdns.org
VITE_SOCKET_URL=https://alumni-api.duckdns.org
```

Then **redeploy** (Vite bakes these in at build time).

## 10. Update OAuth redirect URLs

- Google Cloud Console → Credentials → your OAuth client → Authorised redirect URIs:
  `https://alumni-api.duckdns.org/auth/google/callback`
- LinkedIn Developers → Auth → Redirect URLs:
  `https://alumni-api.duckdns.org/api/v1/oauth/linkedin/callback`

## Day-to-day

```bash
docker compose ps                        # status
docker compose logs -f backend           # API logs (both replicas)
docker compose up -d --build backend     # deploy new backend code after rsync/git pull
docker compose restart nginx             # after editing nginx/nginx.conf
```

## Staying inside free limits

- **Atlas M0**: 512 MB storage and shared CPU. This is the next bottleneck;
  watch Atlas → Metrics. Upgrading to M10 is the first paid step if needed.
- **Email**: Gmail SMTP allows ~500/day. If OTP emails start failing, set
  `BREVO_API_KEY` (free tier ~300/day) or split traffic across providers.
- **Oracle idle reclaim**: Oracle may reclaim Always Free VMs that stay almost
  completely idle for a week. A live app with users is not idle.
- **Vercel Hobby** is for non-commercial use.
