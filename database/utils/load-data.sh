#!/bin/sh

FILE=ATTAINS_Assessment_20220809.gpkg

curl -o "/tmp/${FILE}.zip" https://edap-ow-data-commons.s3.amazonaws.com/data/ATTAINS_Assessment_20220809_gpkg.zip

cd /tmp
unzip "${FILE}.zip"

ogr2ogr -f PostgreSQL PG:"host=0.0.0.0 port=5432 user='${POSTGRES_USER:-"postgres"}' password='${POSTGRES_PASSWORD}' dbname='${POSTGRES_DB:-"postgres"}'" $FILE --config PG_USE_COPY YES

exit 0
