#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd "$repo_dir"

function help() {
	echo "$0 [--reset-db]"
	echo
	echo "Run server locally for use with Cypress E2E tests"
	echo
	echo "Options:"
	echo "   --help       - this screen"
	echo "   --reset-db   - reset db before running"
	echo

}

reset_db=false;
function parse_args() {
	while [ $# -gt 0 ] ; do
		case "$1" in
		--reset-db)
			reset_db=true
			;;

		--help)
			help
			exit 1
			;;

		-*)
			help >&2
			exit 1
			;;
		esac
		shift
	done
}

parse_args "$@"

db=sc_booking_platform_e2e

if [[ -z `psql -Atqc "\list $db" postgres` ]]; then
	echo "Create a database called ${db} to continue"
	exit 1
fi

cd django-root

if $reset_db; then
	DB_NAME=sc_booking_platform_e2e ../bin/reset-db.sh
else
	DB_NAME=sc_booking_platform_e2e ./manage.py migrate
fi

DJANGO_SETTINGS_MODULE=django_site.settings.dev DB_NAME=sc_booking_platform_e2e ./manage.py runserver_cypress --persistent-transactions --nothreading --noreload --insecure "$@"
