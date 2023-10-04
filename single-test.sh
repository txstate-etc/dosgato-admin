#!/bin/bash
#  dosgato-e2e-test:
#      build:
#        context: .
#        dockerfile: ./tests/Dockerfile.test
#      ports:
#        - 9323:9323
#      environment:
#        API_BASE: http://dosgato-api-test
#        RENDER_BASE: http://dosgato-render-test
#        AUTH_REDIRECT: http://fakeauth-test/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Fdosgato-admin-test%3A3000%2F%2Eadmin
#        DOSGATO_ADMIN_BASE: http://dosgato-admin-test:3000/.admin
#      depends_on:
#        - dosgato-api-test
#        - dosgato-admin-test
#        - dosgato-render-test
#        - fakeauth-test
#        #- dosgato-resizer-test
#      volumes:
#        - ./tests/.auth:/app/tests/.auth
#        - ./tests/artifacts:/app/tests/artifacts
#        - ./tests/report:/app/tests/report
NETWORK=${NETWORK:-dosgato-admin_default}
docker build -f ./tests/Dockerfile.test -t registry.its.txstate.edu/dosgato-admin-playwright:dev .
docker run --rm --name dosgato-admin-playwright \
  --network $NETWORK \
  --volume ${PWD}/tests/.auth:/app/tests/.auth \
  --volume ${PWD}/tests/artifacts:/app/tests/artifacts \
  --volume ${PWD}/tests/report:/app/tests/report \
  --env 'API_BASE=http://dosgato-proxy-test/.api' \
  --env 'RENDER_BASE=http://dosgato-proxy-test' \
  --env 'AUTH_REDIRECT=http://fakeauth-test/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Fdosgato-proxy-test%2F%2Eadmin' \
  --env 'DOSGATO_ADMIN_BASE=http://dosgato-proxy-test/.admin' \
  registry.its.txstate.edu/dosgato-admin-playwright:dev "$@"

# docker stop dosgato-admin-playwright
