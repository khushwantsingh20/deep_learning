# Overview

* cypress tests are a (relatively) convenient way of writing frontend tests but:
    * there is no good way of loading test data from JS
    * unlike django unit tests you can't put DB changes in a transaction and simply rollback at the end of a test, so every test has to reload DB contents from scratch
* this package provides
    * a convenient bridge to call python code from JS (can use python factories to load data)
    * a mechanism for holding DB transactions open across django requests and the ability to trigger a rollback when a test is complete

## Usage

* The `runserver_cypress` command adds a `--persistent-transactions` option
    * A DB transaction will be kept open permanently.
    * Hitting the `/django_cypress/rollback/` URL will trigger a rollback and start a new transaction
    * This allows each cypress test case to run in its own transaction and greatly improves DB setup time   
 
`( cd django-root && ./manage.py runserver_cypress 0.0.0.0:8000 --persistent-transactions --nothreading --noreload ) & yarn cypress open`

## Implementation

* `django_cypress.wrap_wsgi_application` takes a django wsgi app and before each request ensures that all connections are always be in a transaction.
* `django.db.backends.base.base.BaseDatabaseWrapper.close_if_unusable_or_obsolete` is normally called at the end of each request; it is patched to keep the connection transactions open.
* This allows multi-request frontend tests to all be run in a single DB transaction, allowing quick restoration of database state between tests
* The following endpoints are provided: 
    * `django_cypress/rollback/` - trigger a rollback and new transaction start for each connection
    * `django_cypress/call/some.module.func/` call the `some.module.func` python function and encode the return value as JSON
    * `django_cypress/kill/` - shut down the web server

There's also functionality to make assertions about the state of the backend from the frontend (see examples in
`./cypress/demo/test.js` and `./django-root/django_cypress/tests.py`).


### Files

The frontend tests involve both JavaScript (`./cypress`) and Django (`./django-root/django_cypress`)

* `cypress/demo`
   * `test.js`: demonstrates usage of custom commands.
* `cypress/integration`
    * Where the tests themselves are specified (see https://docs.cypress.io/api/).
* `cypress/support`
    * `commands.js`: Custom Cypress commands to trigger backend processes from within tests
    * `index.js`: Functions that wrap all tests (called before the 'beforeEach' and after the 'afterEach' of every test).
* `django-root/django_cypress`
    * `tests/*.py`: Functions that can be called from within tests to make changes and assertions at the backend.


### Writing tests

A number of custom Cypress commands exist for interacting with the server,
* `loaddata(whatMethod)` - Calls a method on the server. Intended for loading fixtures.
* `djangoLogin(email)` - Performs a login for the specified user
* `pyAssert(whatMethod)` - Calls a method on the server and logs any exception in Cypress
* `rollback` - Rolls back the existing transaction and starts a new one
* `killserver` - Shuts down the server
* `restartserver`- Kills the server and then restarts it

In addition to the above custom commands, it adds some convenience hooks to the `beforeEach` and `afterEach` of tests.
If the test name contains `::<test name>`, it attempts to call `.setUp()` for the test during the
`beforeEach` and to call `.tearDown()` for the test during the `afterEach`.  
