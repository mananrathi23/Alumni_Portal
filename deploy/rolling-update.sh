#!/usr/bin/env bash
# =============================================================================
# Zero-downtime backend redeploy (rolling update). Run from the repo root on the
# server after pulling new code:
#
#   ./deploy/rolling-update.sh
#
# 1. Build the new image
# 2. Start new replicas NEXT TO the old ones and wait until they are healthy
# 3. Reload Nginx so it routes to old + new
# 4. Stop the old replicas: docker sends SIGTERM, server.js finishes in-flight
#    requests and closes sockets (clients reconnect to the new replicas)
# 5. Reload Nginx so it only knows the new replicas
#
# If a new replica never becomes healthy, the new ones are removed and the old
# ones keep serving: nothing changes for users.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

REPLICAS="${REPLICAS:-2}"
HEALTH_TIMEOUT_S="${HEALTH_TIMEOUT_S:-120}"

old_ids=$(docker compose ps -q backend | sort)
[ -n "$old_ids" ] || { echo "No running backend containers; use: docker compose up -d"; exit 1; }

echo "### Building new backend image..."
docker compose build backend

echo "### Starting $REPLICAS new replica(s) beside the old ones..."
docker compose up -d --no-deps --no-recreate --scale backend=$((REPLICAS * 2)) backend
new_ids=$(comm -13 <(echo "$old_ids") <(docker compose ps -q backend | sort))

echo "### Waiting for new replicas to become healthy..."
deadline=$((SECONDS + HEALTH_TIMEOUT_S))
for id in $new_ids; do
  until [ "$(docker inspect -f '{{.State.Health.Status}}' "$id")" = "healthy" ]; do
    if [ $SECONDS -ge $deadline ]; then
      echo "!!! New replica $id is not healthy; rolling back. Its logs:"
      docker logs --tail 50 "$id" || true
      docker rm -f $new_ids >/dev/null
      exit 1
    fi
    sleep 3
  done
done

echo "### Routing traffic to old + new replicas..."
docker compose exec -T nginx nginx -s reload

echo "### Draining and removing old replicas..."
for id in $old_ids; do
  docker stop -t 30 "$id" >/dev/null   # SIGTERM → graceful shutdown in server.js
  docker rm "$id" >/dev/null
done

docker compose exec -T nginx nginx -s reload
echo "### Done. Running replicas:"
docker compose ps backend
