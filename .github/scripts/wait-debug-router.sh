#!/bin/bash
# Wait until the Lynxtron debug-router is listening.
# Usage: wait-debug-router.sh <log-file> [process-id]
set -euo pipefail

LOG_FILE="${1:-}"
PROCESS_ID="${2:-}"
PORT="${LYNX_DEBUG_ROUTER_PORT:-8901}"

for _ in $(seq 1 30); do
  if [ -n "$PROCESS_ID" ] && ! kill -0 "$PROCESS_ID" 2>/dev/null; then
    echo "Lynxtron exited before opening port $PORT" >&2
    if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
      tail -n 50 "$LOG_FILE" >&2 || true
    fi
    exit 1
  fi

  if (exec 3<>/dev/tcp/127.0.0.1/"$PORT") 2>/dev/null; then
    exec 3>&- 3<&-
    echo "Lynxtron debug-router is up on port $PORT"
    exit 0
  fi
  sleep 1
done

echo "Lynxtron did not open port $PORT in time" >&2
if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
  tail -n 50 "$LOG_FILE" >&2 || true
fi
exit 1
