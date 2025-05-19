-- cpu_load
CREATE EXTENSION IF NOT EXISTS plpython3u;
CREATE OR REPLACE FUNCTION get_load_average(OUT load_1min float, OUT load_5min float, OUT load_15min float) AS
$$
  from os import getloadavg
  la = getloadavg()
  return [la[0], la[1], la[2]]
$$ LANGUAGE plpython3u VOLATILE;
GRANT EXECUTE ON FUNCTION get_load_average() TO pgwatch;
COMMENT ON FUNCTION get_load_average() is 'created for pgwatch';
-- psutil_cpu
/*  Pre-requisites: PL/Pythonu and "psutil" Python package (e.g. pip install psutil)
    "psutil" is known to behave differently depending on the used version and operating system, so if getting
    errors please adjust to your needs. "psutil" documentation here: https://psutil.readthedocs.io/en/latest/
*/
CREATE EXTENSION IF NOT EXISTS plpython3u; /* "plpython3u" might need changing to "plpythonu" (Python 2) everywhere for older OS-es */

CREATE OR REPLACE FUNCTION get_psutil_cpu(
        OUT cpu_utilization float8, OUT load_1m_norm float8, OUT load_1m float8, OUT load_5m_norm float8, OUT load_5m float8,
    OUT "user" float8, OUT system float8, OUT idle float8, OUT iowait float8, OUT irqs float8, OUT other float8
)
 LANGUAGE plpython3u
AS $FUNCTION$

from os import getloadavg
from psutil import cpu_times_percent, cpu_percent, cpu_count
from threading import Thread

class GetCpuPercentThread(Thread):
    def __init__(self, interval_seconds):
        self.interval_seconds = interval_seconds
        self.cpu_utilization_info = None
        super(GetCpuPercentThread, self).__init__()

    def run(self):
        self.cpu_utilization_info = cpu_percent(self.interval_seconds)

t = GetCpuPercentThread(0.5)
t.start()

ct = cpu_times_percent(0.5)
la = getloadavg()

t.join()

return t.cpu_utilization_info, la[0] / cpu_count(), la[0], la[1] / cpu_count(), la[1], ct.user, ct.system, ct.idle, ct.iowait, ct.irq + ct.softirq, ct.steal + ct.guest + ct.guest_nice

$FUNCTION$;

GRANT EXECUTE ON FUNCTION get_psutil_cpu() TO pgwatch;
COMMENT ON FUNCTION get_psutil_cpu() IS 'created for pgwatch';
-- psutil_disk
/* Pre-requisites: PL/Pythonu and "psutil" Python package (e.g. pip install psutil) */
CREATE EXTENSION IF NOT EXISTS plpython3u; /* "plpython3u" might need changing to "plpythonu" (Python 2) everywhere for older OS-es */

CREATE OR REPLACE FUNCTION get_psutil_disk(
        OUT dir_or_tablespace text, OUT path text, OUT total float8, OUT used float8, OUT free float8, OUT percent float8
)
 RETURNS SETOF record
 LANGUAGE plpython3u
 SECURITY DEFINER
AS $FUNCTION$

from os import stat
from os.path import join, exists
from psutil import disk_usage
ret_list = []

# data_directory
r = plpy.execute("select current_setting('data_directory') as dd, current_setting('log_directory') as ld, current_setting('server_version_num')::int as pgver")
dd = r[0]['dd']
ld = r[0]['ld']
du_dd = disk_usage(dd)
ret_list.append(['data_directory', dd, du_dd.total, du_dd.used, du_dd.free, du_dd.percent])

dd_stat = stat(dd)
# log_directory
if ld:
    if not ld.startswith('/'):
        ld_path = join(dd, ld)
    else:
        ld_path = ld
    if exists(ld_path):
        log_stat = stat(ld_path)
        if log_stat.st_dev == dd_stat.st_dev:
            pass                                # no new info, same device
        else:
            du = disk_usage(ld_path)
            ret_list.append(['log_directory', ld_path, du.total, du.used, du.free, du.percent])

# WAL / XLOG directory
# plpy.notice('pg_wal' if r[0]['pgver'] >= 100000 else 'pg_xlog', r[0]['pgver'])
joined_path_wal = join(r[0]['dd'], 'pg_wal' if r[0]['pgver'] >= 100000 else 'pg_xlog')
wal_stat = stat(joined_path_wal)
if wal_stat.st_dev == dd_stat.st_dev:
    pass                                # no new info, same device
else:
    du = disk_usage(joined_path_wal)
    ret_list.append(['pg_wal', joined_path_wal, du.total, du.used, du.free, du.percent])

# add user created tablespaces if any
sql_tablespaces = """
    select spcname as name, pg_catalog.pg_tablespace_location(oid) as location
    from pg_catalog.pg_tablespace where not spcname like any(array[E'pg\\_%'])"""
for row in plpy.cursor(sql_tablespaces):
    du = disk_usage(row['location'])
    ret_list.append([row['name'], row['location'], du.total, du.used, du.free, du.percent])
return ret_list

$FUNCTION$;

GRANT EXECUTE ON FUNCTION get_psutil_disk() TO pgwatch;
COMMENT ON FUNCTION get_psutil_disk() IS 'created for pgwatch';
-- psutil_disk_io_total
/* Pre-requisites: PL/Pythonu and "psutil" Python package (e.g. pip install psutil) */
CREATE EXTENSION IF NOT EXISTS plpython3u; /* "plpython3u" might need changing to "plpythonu" (Python 2) everywhere for older OS-es */

CREATE OR REPLACE FUNCTION get_psutil_disk_io_total(
        OUT read_count float8, OUT write_count float8, OUT read_bytes float8, OUT write_bytes float8
)
 LANGUAGE plpython3u
AS $FUNCTION$
from psutil import disk_io_counters
dc = disk_io_counters(perdisk=False)
if dc:
    return dc.read_count, dc.write_count, dc.read_bytes, dc.write_bytes
else:
    return None, None, None, None
$FUNCTION$;

GRANT EXECUTE ON FUNCTION get_psutil_disk_io_total() TO pgwatch;
COMMENT ON FUNCTION get_psutil_disk_io_total() IS 'created for pgwatch';
-- psutil_mem
/* Pre-requisites: PL/Pythonu and "psutil" Python package (e.g. pip install psutil) */
CREATE EXTENSION IF NOT EXISTS plpython3u; /* "plpython3u" might need changing to "plpythonu" (Python 2 everywhere for new OS-es */

CREATE OR REPLACE FUNCTION get_psutil_mem(
        OUT total float8, OUT used float8, OUT free float8, OUT buff_cache float8, OUT available float8, OUT percent float8,
        OUT swap_total float8, OUT swap_used float8, OUT swap_free float8, OUT swap_percent float8
)
 LANGUAGE plpython3u
AS $FUNCTION$
from psutil import virtual_memory, swap_memory
vm = virtual_memory()
sw = swap_memory()
return vm.total, vm.used, vm.free, vm.buffers + vm.cached, vm.available, vm.percent, sw.total, sw.used, sw.free, sw.percent
$FUNCTION$;

GRANT EXECUTE ON FUNCTION get_psutil_mem() TO pgwatch;
COMMENT ON FUNCTION get_psutil_mem() IS 'created for pgwatch';
-- stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- stat_statements_calls
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
