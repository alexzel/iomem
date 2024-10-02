FROM memcached

USER root

RUN apt-get update && apt-get install -y --no-install-recommends sasl2-bin && rm -rf /var/lib/apt/lists/*

CMD echo $SASL_PASSWORD | saslpasswd2 -c memcached -p && exec memcached -I 10m -S -u root
