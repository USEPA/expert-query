FROM postgis/postgis:14-3.3

RUN apt-get update && apt-get install -y curl unzip gdal-bin

WORKDIR /usr/local/bin

ENV POSTGRES_USER="postgres"
ENV POSTGRES_PASSWORD="example"
ENV POSTGRES_DB="postgres"

COPY ./load-data.sh ./

RUN sed -i -e 's/\r\n$/\n/' load-data.sh
RUN chmod +x load-data.sh
