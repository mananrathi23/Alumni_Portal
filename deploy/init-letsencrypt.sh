#!/usr/bin/env bash
# =============================================================================
# One-time HTTPS setup: gets a free Let's Encrypt certificate for the API domain
# and starts the whole stack. Run from the repo root on the server:
#
#   ./deploy/init-letsencrypt.sh api.example.duckdns.org you@example.com
#
# Add --staging as a 3rd argument to test against Let's Encrypt's staging server
# first (avoids hitting the real rate limit while you debug DNS/firewall).
# Renewal afterwards is automatic (certbot service in docker-compose.yml).
# =============================================================================
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email> [--staging]}"
EMAIL="${2:?Usage: $0 <domain> <email> [--staging]}"
STAGING_FLAG=""
[ "${3:-}" = "--staging" ] && STAGING_FLAG="--staging"

cd "$(dirname "$0")/.."
LIVE_DIR="certbot/conf/live/api"

[ -f .env ] || { echo "Missing .env (copy .env.example and set REDIS_PASSWORD)"; exit 1; }
[ -f backend/.env ] || { echo "Missing backend/.env (copy backend/.env.example and fill it in)"; exit 1; }

mkdir -p "$LIVE_DIR" certbot/www

# 1. Temporary self-signed cert so Nginx can start and serve the ACME challenge
if [ ! -f "$LIVE_DIR/fullchain.pem" ]; then
  echo "### Creating temporary certificate..."
  docker compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/api/privkey.pem \
      -out /etc/letsencrypt/live/api/fullchain.pem \
      -subj /CN=localhost" certbot
fi

# 2. Start everything (Redis → backend → Nginx)
echo "### Building and starting the stack..."
docker compose up -d --build

# 3. Replace the temporary cert with a real one
echo "### Requesting Let's Encrypt certificate for $DOMAIN..."
docker compose run --rm --entrypoint "rm -rf /etc/letsencrypt/live/api /etc/letsencrypt/archive/api /etc/letsencrypt/renewal/api.conf" certbot
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_FLAG \
    --cert-name api -d $DOMAIN \
    --email $EMAIL --agree-tos --no-eff-email --non-interactive" certbot

# 4. Load the new certificate
docker compose exec nginx nginx -s reload
echo "### Done. Check: curl https://$DOMAIN/api/v1/health"
