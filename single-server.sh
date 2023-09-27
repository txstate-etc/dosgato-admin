#!/bin/bash
docker-compose -f docker-compose.test.yml -f docker-compose.test.override.yml up #--build --abort-on-container-exit --exit-code-from dosgato-e2e-test
