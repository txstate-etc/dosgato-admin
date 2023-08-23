
# making sure it is in the directory where test.sh is saved
cd "`dirname "$0"`"

docker-compose -f docker-compose.test.yml down


override=''
if [ -e docker-compose.test.override.yml ]; then
  override='-f docker-compose.test.override.yml'
fi

docker-compose -f docker-compose.test.yml $override up --build --abort-on-container-exit --exit-code-from dosgato-e2e-test

#servers up won't exit when test is over
# docker-compose -f docker-compose.test.yml $override up --build

#test no override
# docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from dosgato-e2e-test

#test only for debugging
#docker-compose -f docker-compose.test.yml  -f docker-compose.test.override.yml  up --build dosgato-e2e-test