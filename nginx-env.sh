#!/bin/sh
envsubst '${API_BASE} ${RENDER_BASE} ${AUTH_REDIRECT}' < /etc/nginx/nginx-template.conf > /etc/nginx/nginx.conf
exit 0
