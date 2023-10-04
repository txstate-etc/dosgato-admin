#!/bin/bash
override=''
if [ -f docker-compose.test.override.yml ]; then
  override='-f docker-compose.test.override.yml'
fi
docker-compose -f docker-compose.test.yml $override up --build mysql-test fakeauth-test dosgato-api-test dosgato-render-test dosgato-admin-test dosgato-proxy-test
# --abort-on-container-exit --exit-code-from dosgato-e2e-test
# docker compose stop dosgato-e2e-test
