FROM postgres:17

RUN apt update && apt install postgresql-plpython3-17 -y && rm -rf /var/lib/apt/lists/*

COPY pgwatch.sql /pgwatch.sql
# COPY updateConfig.sh      /docker-entrypoint-initdb.d/_updateConfig.sh


HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 CMD cat /initialised.txt && pg_isready -U $POSTGRES_USER -d postgres

ENTRYPOINT ["/bin/bash","-c","docker-entrypoint.sh postgres -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.track=all -c track_io_timing=on & \n rm -f /initialised.txt || true && \n until pg_isready -U $POSTGRES_USER -d postgres; do sleep 3; done && \n psql -U $POSTGRES_USER -d postgres -c \"CREATE ROLE $POSTGRES_METRICS_USER WITH LOGIN PASSWORD '$POSTGRES_METRICS_PASSWORD'\" || true && \n psql -U $POSTGRES_USER -d postgres -c \"CREATE DATABASE $POSTGRES_METRICS_DBNAME OWNER $POSTGRES_METRICS_USER\" || true && \n cat /pgwatch.sql | psql -U $POSTGRES_USER -d postgres || true && \n cat /pgwatch.sql | psql -U $POSTGRES_USER -d $POSTGRES_DB || true && \n cat /pgwatch.sql | psql -U $POSTGRES_USER -d $POSTGRES_METRICS_DBNAME || true && \n echo done > /initialised.txt && \n wait"]
