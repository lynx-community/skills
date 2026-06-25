#!/bin/bash
# Wait until the EmbeddedLynx debug-router is listening on 127.0.0.1:8901.
# Usage: wait-debug-router.sh <log-file>
set -euo pipefail

LOG_FILE="${1:-}"

for _ in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/8901) 2>/dev/null; then
    exec 3>&- 3<&-
    echo "EmbeddedLynx debug-router is up on port 8901"
    exit 0
  fi
  sleep 1
done

echo "EmbeddedLynx did not open port 8901 in time" >&2
if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
  tail -n 50 "$LOG_FILE" >&2 || true
fi
exit 1
