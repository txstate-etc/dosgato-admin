
# making sure it is in the directory where test.sh is saved
cd "`dirname "$0"`"

docker-compose -f docker-compose.test.yml down

#clean previous run data
rm -r ./tests/.auth
rm -r ./tests/artifacts
rm -r ./tests/report

override=''
if [ -e docker-compose.test.override.yml ]; then
  override='-f docker-compose.test.override.yml'
fi

COMPOSE_HTTP_TIMEOUT=300 docker-compose -f docker-compose.test.yml $override up --build --abort-on-container-exit --exit-code-from dosgato-e2e-test