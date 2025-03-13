#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$repo_dir"

function lint_python_package_vulns() {
	# This should really only run on CI linting stage since it pollutes your virtualenv with extra packages
	notice "Linting python packages for known security vulnerabilities"

	require_virtualenv

	pip install safety
	safety check --full-report --cache
}

lint_python_package_vulns
exit $return_code
