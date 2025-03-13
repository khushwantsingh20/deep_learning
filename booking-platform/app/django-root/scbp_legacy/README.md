# Legacy system

This exists to migrate data from legacy system. Models are all generated from
call to `inspectdb`.

Existing databases are MSSQL databases in RDS. There's 2 different databases
we need to pull data.

## Setup

- Requires Microsoft ODBC Driver 17 for SQL Server

```bash
brew install msodbcsql17 mssql-tools
```

- Add env vars for RDS details

```
LEGACY_DB_PASSWORD=<see tt>
LEGACY_DB_HOST="sccd.cki7sukhfth9.ap-southeast-2.rds.amazonaws.com"
LEGACY_DB_NAME="sccd-prod"
LEGACY_APP_ACTIVATE="True"
```

- Note that django app and settings aren't initialised unless the `LEGACY_APP_ACTIVATE` env var is set

## Deployment

- Uses Heroku buildpack apt (see `Aptfile`) to install relevant files
- `odbcinst.ini` contains relevant details for driver. 
- Can run with `heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py runscript scbp_legacy.import_<name>`

## Go live plan

1. Put existing site into maintenance

2. Take snapshot in RDS

   a. https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2#db-snapshots:
   b. Click take snapshot and give it a name

3. Copy snapshot to North Virginia region

   a. Once snapshot finished click the checkbox then under actions select "Copy"
   b. Select 'North Virginia' as the destination region and choose an identifier for the snapshot

4. Restore database from snapshot in NV region

   a. Click the 'View in destination region' button
   b. Once finished copying click 'Actions' and choose 'Restore Snapshot'
   c. Choose a db identifier and select DB Instance Class of 'db.m4.large'
   d. Once finished update security group to allow inbound from `0.0.0.0/0`

5. Update production env vars with new database details
    ```
    LEGACY_DB_PASSWORD="<details in tt>"`
    LEGACY_DB_HOST="<get this from restored snapshot>"
    LEGACY_DB_NAME="sccd-prod"
    LEGACY_APP_ACTIVATE="True"
   ```

6. Run importer
   
   ```
   heroku run django-root/manage.py migrate --app <app name>
   heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py loaddata init hour_rate_type booking_lead_time --app <app name>
   heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py runscript scbp_legacy.import_clients --app <app name>
   heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py runscript scbp_legacy.import_drivers --app <app name>
   heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py runscript scbp_legacy.import_bookings --app <app name>
   heroku run ODBCINSTINI=odbcinst.ini ODBCSYSINI=/app django-root/manage.py loaddata live --app <app name>
   heroku pg:psql -c "UPDATE scbp_core_booking SET vehicle_id = (SELECT current_vehicle_id FROM scbp_core_driver_user WHERE user_ptr_id = scbp_core_booking.driver_id) WHERE (pickup_time IS NOT NULL or booking_status = 10) and driver_id is not null" --app <app name>
   ```
   
7. Once finished delete the restored database and the snapshots
