#!/bin/bash
set -euo pipefail
# Clear proxy-related environment variables that break public npm downloads
for var in HTTP_PROXY HTTPS_PROXY NO_PROXY http_proxy https_proxy no_proxy \
  YARN_HTTP_PROXY YARN_HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy; do
  unset "$var" 2>/dev/null || true
  export "$var"=""
done

# Ensure npm itself forgets any persisted proxy settings
npm config delete proxy >/dev/null 2>&1 || true
npm config delete https-proxy >/dev/null 2>&1 || true


# Run the provided command (defaults to npm install)
if [ "$#" -eq 0 ]; then
  set -- npm install
fi
