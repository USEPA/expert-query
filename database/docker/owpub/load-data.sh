#!/bin/sh

if [ $# -lt 1 ]; then
    echo "USAGE: $0 zipped_geopackage_url"
    exit 1
fi

ZIP_FILE="attains-assessment-data.zip"
DATA_URL=$1

curl -o "/tmp/${ZIP_FILE}" $DATA_URL

cd /tmp
unzip $ZIP_FILE
rm $ZIP_FILE

DATA_FILE=$(find . -maxdepth 1 -type f -name "*.gpkg" -printf "%f\n")
ogr2ogr -f PostgreSQL PG:"host=0.0.0.0 port=5432 user='${POSTGRES_USER:-"postgres"}' password='${POSTGRES_PASSWORD}' dbname='${POSTGRES_DB:-"postgres"}'" $DATA_FILE --config PG_USE_COPY YES
rm $DATA_FILE

exit 0
