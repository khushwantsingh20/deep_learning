# Sourthern Cross Booking Platform
* [Overview](#overview)
    * [Purpose](#purpose)
    * [Tech Stack](#tech-stack)
* [Architecture](#architecture)
    * [Directory Layout](#directory-layout)
    * [User Types](#user-types)
    * [Mobile App](#mobile-app)
    * [Async Tasks](#async-tasks)
* [Development](#development)
    * [Staging](#staging)
* [Deployment](#deployment)

master: [![build status](https://gitlab.internal.alliancesoftware.com.au/southern-cross/booking-platform/badges/master/build.svg)](https://gitlab.internal.alliancesoftware.com.au/southern-cross/booking-platform/commits/master)

## Overview

### Purpose

A web app for taking bookings for limo service.

Client uses a few names and at time of writing hasn't decided on final branding for this app:

- vha (vha.com.au)
- limomate
- Southern Cross

### Tech Stack
* Hosted on Heroku
* nginx + gunicorn
* Python 3.11
    * Django 2.2
* React 16
    * Redux
    * ImmutableJS
    * ant.design
    * djrad
* Postgres 12
* node 16 (dev only)
    * webpack build

## Frontend

### SVG support

Import svg's either as a URL or convert to a react component:

```js
import svgUrl from './icon.svg';
// data:image/svg+xml;base64,PD94bW....
import { ReactComponent as Icon } from './icon.svg';
// Usage as any other component
<Icon />
```

See [svgr](https://github.com/smooth-code/svgr).

## Architecture

* 3 single page apps using djrad; one each for admin, main app, and driver app
    * See `index-admin.js` for entry point to admin app. See `ScbpAdminSite` for djrad site.
    * See `index-app.js` for entry point to main app. See `ScbpAppSite` for djrad site.
    * See `index-driver.js` for entry point to driver app. See `ScbpDriverSite` for djrad site.

### Directory layout

Paths listed here are relative `frontend/src`

*Top level*

* `/common` - contains components shared across all sites
* `/core` - setup of core redux reducer, field factory for djrad
* `/styles` - global style config (eg. variables etc)
* `/images` - static images used in frontend
* `/admin` - code only relevant to admin site
* `/app` - code only relevant to admin site

*Split within a site dir or common dir based on functionality*

* `/common/auth` - auth specific code
* `/app/booking` - booking process specific code

*Split within feature dir*

* `/views` - any components that are conceptually a single page that sits at a route (ie. no re-use, very specific)
* `/components` - any components not specific to a route
* `/hooks` - any custom hooks for this feature
* `models.js` - Djrad model classes/registrations for this feature
* `consts.js` - Any constants specific to this feature
* `actions.js` - (rare) Any redux actions specific to this feature
* `reducers.js` - (rare) Any redux reducers specific to this feature
* `*.js` - any other top level specific things to this feature

*Other notes*

- Sites cannot import from other sites, but can import from common. Site files can not be imported from outside the site directory (eg from common).
    - A lint rule is in place to enforce this
    - This is because models in different sites may have different fields, some models may not exist in same site, API endpoints are different etc. Having a hard separation avoids issues around this.
- Within feature directories you can split further by sub functionality if desired
- These are guidelines meant to help make things more manageable and aid in discoverability; if it's becoming cumbersome please raise it with the team

### User Types

#### User
* The core `User` table stores auth login details
    * email is username
* All other user types extend this with a one to one relationship
* The `user_type` attribute is used to determine type of underlying user type. This might be a static
attribute (eg. `CustomerUser`) or a database field (eg. `AdminUser`)

#### User Types

* Admin - this is a Southern Cross administrator and has one of a few types (manager, supervisor, staff member)
* Customer - this is the clients of southern cross

#### Group
* Django `Group` table is not used
    * For this particular project the `user_type` field on the profile performs the function that django's `Group` records usually do (attaching permissions to a `User`)

#### Permissions
* A custom `CSVPermissionsBackend` provides permission checks
    * `settings.CSV_PERMISSIONS_PATH` defines a CSV file containing permissions definitions
    * The motivation behind this is to
        * be able to provide a summary of access control to the client that they can understand
        * be able to easily enumerate all possible permissions in the system
        * reduce the number of custom permission functions
            * most permissions checks fit into a standard pattern
* The permissions CSV file is parsed on server startup
    * If there are any validation errors then the server will refuse to start
    * Definitive file format can be found in `csv_permissions.permissions._parse_csv()`
    * Each permission must be defined as a global or per-object permission
        * calling `has_perm()` with an object for a global permission will raise an exception
        * calling `has_perm()` without an object for a per-object permission will raise an exception
    * Possible values for a cell in the spreadsheet:
        * `yes` - user type has this global permission
        * `all` - user type has access to all records
        * `own` - user type has access only to records it owns
        * `own: func` - user type has access only to records it owns, use `func` to determine if they own it
        * `custom: func` - user type should invoke `func` to determine if user has this permission
        * `` - user type does not have this permission


### Mobile App

#### Frontend Integration
* There are currently two actions in frontend specifically invoked only by the mobile app.
    * First one asks for the current gps location, and second one seek out firebase device id (see #Firebase section)
    * Look at frontend hooks for webkitBridge and where webkitBridge's used
    * Effectively, react makes a call to interfaces in native app code, which native app responses by touching callback functions preset in code
    * These codes have no effect if pages are not loaded from within the app.
* For the actual app itself, see `ios` project within this group.

#### Firebase Cloud Messaging
* As part of Mobile App Integration, FCM is used to send notifications out to the user
    * this interface sits in scbp_core.notification.send_user_message
* To send a notification, a device unique identifier, or "token" is required.
    * This token is acquired by frontend when talking to the app which had Firebase SDK embedded.
    * Token is stored in MobileDeviceToken model, with a foreign key link to user.
        * An user hence can have multiple devices linked back, and notifications targeting an user would be send to all those devices.
        * There's currently no restriction on the uniqueness of token, which means a token may be linked to multiple users as well, in the form of multiple MobileDeviceToken entities.
            * This means if multiple accounts had logged into the app on one device, any notification sending to any of those user will reach it.
            * A "withdraw" feature is planned, but not implemented as of yet.

#### Android mobile app

This section should be updated to reflect the current release of the application in the Android Play Store every time a
new release is made.

Upload date: 25th Feb, 2020
Publish date: 1st Mar, 2020
Target SDK: 28
Supported API Levels: 21+

The android release is built from the android repository:
https://gitlab.internal.alliancesoftware.com.au/southern-cross/android

#### Apple mobile app

This section should be updated to reflect the current release of the application in the Apple App Store every time a new
release is made.

Upload date: 23rd Sept, 2019
Publish date: 1st Mar, 2020
Target: iOS 11.0 or later

The iOS release is built from the ios repository:
https://gitlab.internal.alliancesoftware.com.au/southern-cross/ios

### Local dev

To simplify the running of various local services, there is a sample mprocs configuration file (`mprocs.sample.yaml`).

You can copy this into `mprocs.yaml` to use as a baseline for your own local preferences if you wish.

### Async Tasks

We use [celery](https://docs.celeryproject.org) with redis as the broker.

To run celery use the `start_celery` management command.

Make sure redis is running:

```bash
redis-server
```

then

```bash
cd django-root
./manage.py start_celery
```

#### Writing and using tasks

Read [Working with Asynchronous Celery Tasks – lessons learned](https://blog.daftcode.pl/working-with-asynchronous-celery-tasks-lessons-learned-32bb7495586b)
so you are aware of issues when dealing with celery tasks

Ideally tasks should be idempotent in which case you should use the `acks_late` option (example lifted from above):

```python
@transaction.commit_on_success
@shared_task(bind=True, default_retry_delay=60, max_retries=120, acks_late=True)
def send_welcome_email_task(user_id):
   user = User.objects.select_for_update().get(id=user_id)
   if not user.is_welcome_email_sent:
       try:
           send_email(email=user.email, subject='Welcome', content='...')
       except SMTPException as e:
           self.retry(exc=e)
       else: # no exception
          user.is_welcome_email_sent = True
          user.save()
```

If you are queuing a task and it depends on data yet to be written to the database (ie. you are
queuing it in a transaction) use the `TransactionAwareTask` (see [this article](https://medium.com/hypertrack/dealing-with-database-transactions-in-django-celery-eac351d52f5f)).

```python
from scbp_core.base_task import TransactionAwareTask

@shared_task(bind=True, base=TransactionAwareTask)
def my_task(self, record_id):
   ...
```

To queue a task you typically call:

```python
my_task.delay()
```

See [tasks documentation](https://docs.celeryproject.org/en/latest/userguide/tasks.html) for more details.

### Google Docs
Scripts to be copied in to Google documents are stored in `google_docs`. At this time, only one script is included,
and this is designed to be copied into a spreadsheet configured for use as the Recipient Generated Invoices
spreadsheet. See the instructions at the top of that script for installation instructions.

## Development

### Install Dependencies

* Create & activate a python virtualenv
    * Assumes a working OSX brew-based `pyenv` + `pyenv-virtualenvwrapper` install
```bash
./bin/init-dev-virtualenv.sh
```

* Activate node version (`nvm use`)
* Install package dependencies:

```bash
yarn install
pip install -r requirements.txt
pip install -r requirements/dev.txt
```

* git hooks are installed when you run `yarn install`

* Install OS packages
```bash
brew install redis
brew cask install wkhtmltopdf
```

### Configuration

* If you get an `Unrecognised host` error
    * Add your hostname & platform (macOS is `'darwin'`) to `_dev_hosts` in `django-root/django_site/settings/__init__.py`
* (mysql only) Add database username/password to `django-root/django_site/settings/dev.py` (will read from `~/.my.cnf` if not specified)
* For environmental variables, you can create a .env file in your project root and it'll be used by the project.
    * Use .env.sample as a reference for common env variables you want to set.
    * OS-level env variables has a higher priority over .env, ie, if a value's set by OS (or heroku), the same value in .env will be ignored.
* Relevant settings for this project
    * `GOOGLE_API_KEY` - used for integrating with google maps on frontend. See [Google API Key - Local Dev](https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981#account_6585) in tt.
        * Note that this key is restricted by referrer. New referrers can be added in the key configuration.
    * `GOOGLE_API_SERVER_KEY` - used for integrating with google maps on backend. See [Google API Server Key - Local Dev](https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981#account_6617) in tt.
        * Note that this key is IP restricted. New IP's can be added in the key configuration.
    * `AWS_*` settings - only required for staging / production. See [Amazon IAM *](https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981#account_6587) settings in tt.
    * `EMAIL_*` settings for sendgrid - only required for staging / production. See [Sendgrid API key](https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981#account_6575) in tt. Note that
    Sendgrid
    * `SENTRY_DSN_JS` and `SENTRY_DSN_PYTHON` - See [Sentry account](https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981#account_6578). These values correspond to the
    projects setup in sentry (one project for JS, one for Python). You don't need this locally.
    * `EWAY_API_KEY` - Required by backend eway integration. For development sandbox mode use tt:client=693#account_6671
    * `EWAY_API_KEY_PASSWORD` - Required by backend eway integration. For development sandbox mode use tt:client=693#account_6672
    * `EWAY_CLIENT_SIDE_ENCRYPTION_KEY` - Used to encrypt details on frontend before passing to backend. For development sandbox mode use tt:client=693#account_6673
    * `EWAY_API_SANDBOX_ENABLED` - Set to `True` to use sandbox env for eway
    * `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY` - used for FCM notifications. No distinction between dev/live. use tt:client=693#account_6662 and tt:client=693#account_6664
    * `ESENDEX_USER`, `ESENDEX_PASSWORD`, and `ESENDEX_ACCOUNT_REFERENCE` - used for SMS sending. You should only need this to test SMS functionality. For development, use tt:client=693#account_6659
    * `CAMPAIGN_MONITOR_API_KEY` and `CAMPAIGN_MONITOR_LIST_ID` - used for Campaign Monitor (mailing list manager).
        If not set, Campaign Monitor export will not function, but the rest of the app will still work.
        Live credentials can be found at https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=2120#account_7074


### Code formatting

* Javascript code is formatted with [prettier](https://prettier.io). It is recommended that you setup
your editor to format on save. See [pycharm](https://prettier.io/docs/en/webstorm.html) instructions. Editors
like vscode have plugins that will do it for you.

* Python code is formatted with [black](https://black.readthedocs.io). See the [editor integration](https://black.readthedocs.io/en/stable/editor_integration.html)
page for getting your editor to format code on save.

* NOTE: All code is formatted on commit so you don't _have_ to manually do it.

### Database Setup

* Run `bin/resetdb.sh`

* Fixtures:
    * `init` - core reference data that shouldn't be edited but should be in the DB (eg postcodes)
    * `dev_users` - users for testing purposes. A superuser with u/p of `support@alliancesoftware.com.au` / `password` exists.
    * `dev` - application data for testing purposes

* To generate and update fixtures you need for the app, see: https://docs.djangoproject.com/en/2.2/ref/django-admin/#dumpdata
    * an --indent of 4 is recommended to keep output readable
    * see the section above for fixture naming conventions
    * eg: `./manage.py dumpdata -a --indent 4 --natural-foreign --output scbp_core/fixtures/init.json scbp_core`


### Dev Servers

* Webpack dev server

```bash
yarn dev
```

* Django server

```bash
cd django-root
./mange.py runserver_plus
```

### Style guide

The style guide contains examples and documentation for components. You should check it
regularly and it is often useful for a development testbed for new, standalone components.

* Start style guide server
```bash
yarn styleguide
```

All information on how to use and update the style guide is located within it.

### Testing

#### Backend unit tests

* Standard [django unit tests](https://docs.djangoproject.com/en/2.2/topics/testing/)
* Uses [factory boy](https://factoryboy.readthedocs.io/en/latest/) for model factories

#### Frontend unit tests

* Written with [react-testing-library](https://testing-library.com/docs/react-testing-library/) and [jest](https://jestjs.io)
* Matchers from [jest-dom](https://github.com/gnapse/jest-dom) are available for convenience
* `yarn test --watch` to run tests and watch for changes
* Pulls data necessary from djrad from the `generate_site_json` management command. See `jest.config.js` for where this happens.

To write a test that depends on djrad features import from either 'test-utils-admin' (if testing using djrad admin site) or
'test-utils-app' (if testing using djrad app site).

For example:

```js
import React from 'react';
import { render } from 'test-utils-admin';
import UserForm from '../UserForm';

test('UserForm ', () => {
    const fn = jest.fn();
    render(<UserForm model="scbp_core.user" onSubmit={fn}/>);
    ...
});
```

#### End to end tests

*AS OF OCTOBER 3rd 2023, CYPRESS TESTS ARE DISABLED*

#### Manual Testing

See [Manual Tests](doc/manual-tests.md)

## Deployment

### Sentry

[Sentry](https://sentry.io) is used to capture errors for both python and javascript.

To setup these env vars need to set:

```
SENTRY_DSN_PYTHON="<DSN FROM SENTRY PROJECT FOR DJANGO>"
SENTRY_DSN_JS="<DSN FROM SENTRY PROJECT FOR JS>"
```

This activates Sentry in both django and the frontend. Sentry has the concept of releases which we
set to the current git commit short hash. You can match up errors from Sentry to the commit they were
deployed from (eg. any issue raised against that release could have been introduced from changes from
that release hash to the prior release hash).

To allow better debugging Sentry needs source maps so it can provide detailed stack trace. To achieve this
as part of the frontend build we generate source maps, upload them to Sentry (using [@sentry/webpack-plugin](https://github.com/getsentry/sentry-webpack-plugin))
and then remove them so we don't deploy them (see `postbuild` step in `package.json`). Note that we retain
the source maps in the `frontend-react/dist-source-maps/` in case required - they are just remove from
`frontend-react/dist/` so they don't end up accessible in production.

In order for this to work when you run a build you need to have a token setup to access the API. If you don't
have this the build will prompt you to set it up before continuing. To set this up at any time run:

```bash
SENTRY_PROPERTIES=./frontend/sentry.properties yarn sentry-cli login
# Choose no to open browser
# Get token from TT https://tt.internal.alliancesoftware.com.au/admin/timetracker/clients/servers/view?serverId=1981
# Verify this works:
SENTRY_PROPERTIES=./frontend/sentry.properties yarn sentry-cli releases list
```

If you want to run a build without sending artifacts to Sentry then use this command:

```bash
yarn build --disable-sentry
```

### Production Build

* Build assets

```bash
yarn build
```

* Commit changes (with message `build`) and push to `master` branch

### Server

We use Heroku for deployment and pipelines for promoting changes from staging to live. As such
you only ever push to staging and then a sendlive involves promoting staging to production.

You should have your own user for Heroku that is added to the project.

#### Local setup

Once you have access to the project you should be able to run

```bash
heroku git:remote -a booking-platform-staging
```

#### Staging Deployment

* In the initial stages changes will go to master and just push to heroku (after doing a build)
  ```bash
  git push heroku
  ```
* To copy live DB to staging:
    * Use [pg:copy](https://devcenter.heroku.com/articles/heroku-postgres-backups#direct-database-to-database-copies) to copy data from production to staging

* To generate PDF's on the server wkhtmltopdf buildpack is required: https://github.com/dscout/wkhtmltopdf-buildpack

#### Live Deployment

TODO
