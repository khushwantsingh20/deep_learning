#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd "$repo_dir"

cd django-root

./manage.py runserver_cypress --persistent-transactions --nothreading --noreload --insecure "$@"
