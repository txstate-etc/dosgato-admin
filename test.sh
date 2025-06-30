
docker-compose -p dosgato-admin-test -f docker-compose.test.yml down -v

override=''
if [ -e docker-compose.test.override.yml ]; then
  override='-f docker-compose.test.override.yml'
fi

docker-compose -p dosgato-admin-test -f docker-compose.test.yml $override up --build --abort-on-container-exit --exit-code-from testing-container
