#!/bin/sh
envsubst '${API_BASE} ${RENDER_BASE} ${AUTH_REDIRECT} ${ASSET_LIVE_BASE} ${ADMIN_ALLOW_HOST_REGEX}' < /etc/nginx/nginx-template.conf > /etc/nginx/nginx.conf
exit 0
