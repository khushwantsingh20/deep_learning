#@IgnoreInspection BashAddShebang
#
# exports the following items:
#
# functions:
#  fail() - print arguments to stderr and exit with a failure code
#
# general variables:
#  MD5SUM - path to the gnu md5sum
#  repo_dir - root of the git repository
#
# django variables: (should match settings.py)
#  is_ci - true or false depending on whether running on a CI server
#  project_dir - root django project path
#  base_dir - django site app path
#  static_dir - collected static files path
#  frontend_dir - frontend spa javascript source path

function is_color_terminal() {
	# Possible ways of deciding whether to do color
	# 	[[ -t 1 ]] means currently running in a terminal
	# 	[[ -p /dev/stdout ]] means stdout is a pipe
	# 	$TERM is the current terminal type
	#
	# TERM is usually 'xterm' or 'xterm-color' when running in iterm
	# TERM is 'dumb' when running inside SourceTree
	# ! [[ -t 1 ]] && [[ -p /dev/stdout ]] when running as a subprocess of lint-staged
	#
	# This is the most promising heuristic so far:
	[[ $TERM != "" && $TERM != "dumb" ]] || $is_ci

	# debug code (because this will inevitably need tweaking!)
#	echo "Term is $TERM" > termcolor.debug
#	echo "termcap?     " $( [[ -t 1 ]] && echo 'yes' || echo 'no' ) >> termcolor.debug
#	echo "pipe?       " $( [[ -p /dev/stdout ]] && echo 'yes' || echo 'no' )  >> termcolor.debug
}

function require_virtualenv() {
	local virtualenvs_dir

	# validate that a virtualenv is active and if not, try to activate it
	if [[ $VIRTUAL_ENV = "" ]] ; then
		virtualenvs_dir=${WORKON_HOME:-${VIRTUALENVWRAPPER_HOOK_DIR:-~/.virtualenvs}}
		if [[ $( type -t workon ) = "function" ]] ; then
			workon "$(<.venv)"
		elif [[ -e "$virtualenvs_dir/$(<.venv)/bin/activate" ]] ; then
			source "$virtualenvs_dir/$(<.venv)/bin/activate"
		elif [[ -e venv/bin/activate ]] ; then
			source venv/bin/activate
		elif [[ -e .venv/bin/activate ]] ; then
			source .venv/bin/activate
		else
			fail "No virtualenv is active (and couldn't find the right one)"
		fi

	fi
}

function require_nodejs() {
	local node_ver_active
	# Check the version of nodejs in use
	node_ver_active=$( node --version | sed -E 's/^v([0-9]+)\.[0-9]+\.[0-9]+.*/\1/' )
	if [[ $node_ver_active != $(<.nvmrc) ]] ; then
		echo "WARNING: Expected nodejs '$(<.nvmrc)', found '$node_ver_active'. Switching." >&2

		if ! type -t nvm 2>/dev/null >/dev/null ; then
			nvm_dirs="${NVM_DIR:-$HOME/.nvm /usr/local/opt/nvm}"
			for nvm_dir in $nvm_dirs ; do
				if [[ -e $nvm_dir/nvm.sh ]] ; then
					source $nvm_dir/nvm.sh
					break
				fi
			done
		fi

		if ! type -t nvm 2>/dev/null >/dev/null ; then
			err "Could not find nvm"
		else
			nvm use
		fi
	fi
}

function set_python_target_vars() {
	[[ -e .python-version ]] || fail "ERROR: Missing local .python-version file -- see pyenv documentation"

	target_ver=$(< .python-version )
	target_ver_short=$( cut -f-2 -d. < .python-version )
	target_venv=$(<.venv)
}

function fail() {
	echo "${COLOR_ERROR}$*${COLOR_RESET}" >&2
	exit 1
}

function pathadd() {
	if [[ -d "$1" && ":$PATH:" != *":$1:"* ]]; then
		PATH="${PATH:+"$PATH:"}$1"
	fi
}


# Need to set up terminal colors before any usage of 'fail'
is_ci="${CI-false}"
if is_color_terminal ; then
	COLOR_ERROR=$'\e[1;31m'		# bold red
	COLOR_WARN=$'\e[1;33m'		# bold yellow
	COLOR_BOLD=$'\e[1m'
	COLOR_RESET=$'\e[0m'
else
	COLOR_ERROR=''
	COLOR_WARN=''
	COLOR_BOLD=''
	COLOR_RESET=''
fi


# If running inside a git GUI, /usr/local/bin may not be on PATH; we need it
if [[ "$OSTYPE" =~ ^darwin ]] ; then
	pathadd /usr/local/bin
fi

MD5SUM="$( which md5sum || which gmd5sum || fail 'Cannot find md5sum' )"
FIND="$( which gfind || which find || fail 'Cannot find GNU findutils' )"
XARGS="$( which gxargs || which xargs || fail 'Cannot find GNU xargs' )"

function parallel_xargs() {
	# xargs wrapper that by default operates in parallel
	local max_procs=4
	local max_args=200
	local delimiter="\n"

	while [[ $# -gt 0 ]] ; do
		case "$1" in
			--delimiter=* | -d=*)
				delimiter="${1#*=}"
				shift
				;;
			--delimiter | -d)
				shift
				delimiter="$1"
				shift
				;;

			--max-args=* | -n=*)
				max_args="${1#*=}"
				shift
				;;
			--max-args | -n)
				shift
				max_args="$1"
				shift
				;;

			--max-procs=* | -P=*)
				max_procs="${1#*=}"
				shift
				;;
			--max-procs | -P)
				shift
				max_procs="$1"
				shift
				;;
			*)
				break
				;;
		esac
	done

	$XARGS --delimiter "$delimiter" --max-args "$max_args" --max-procs "$max_procs" "$@"
}

if [[ "$OSTYPE" =~ ^darwin ]] ; then
	# -quit is a GNU findutils extension
	$FIND -quit 2>/dev/null || fail "Missing GNU find; run 'brew install findutils'"
fi

# Ensure that GNU realpath is present (to resolve symlinks & canonicalize path)
function find_realpath() {
	local candidates=(
		realpath
		grealpath
	)
	for candidate in "${candidates[@]}" ; do
		if "$candidate" --canonicalize-missing / 2>/dev/null >/dev/null ; then
			realpath="$candidate"
			return
		fi
	done
	fail "Missing GNU realpath; run 'brew install coreutils'"
}
find_realpath

poetry_ver_min="1.3"

function get_poetry_ver() {
	poetry_ver=$( poetry --version | egrep '^Poetry \(?version ' | sed 's/Poetry (\{0,1\}version //' | sed 's/)//' || true )
	[[ $poetry_ver != "" ]] || fail "ERROR: poetry needs to be installed outside the virtualenv"
	echo "$poetry_ver"
}

function poetry_version_check() {
	local poetry_ver="$( get_poetry_ver )"
	local poetry_ver_prog=$( cat <<- END
		import sys
		try:
		  from pip._vendor.packaging.version import parse
		except ImportError:
		  # if skip the check if pip not available
		  # (we might not have activated a virtualenv yet)
		  print("skipped")
		else:
		  print(str(parse('$poetry_ver') >= parse('$poetry_ver_min')).lower())
		END
	)
	local poetry_ver_ok=$( python3 -c "$poetry_ver_prog" )
	if [[ $poetry_ver_ok = "skipped" ]] ; then
		warn "ERROR: no pip, unable to check poetry version $poetry_ver is >= $poetry_ver_min"
	elif [[ $poetry_ver_ok != "true" ]] ; then
		fail "ERROR: poetry version $poetry_ver is not >= $poetry_ver_min"
	fi
}



# Core python packages that should not be removed or your virtualenv will probably break
CORE_PYTHON_PACKAGES=(
	pip
	pkg-resources # ubuntu/debian bug: https://stackoverflow.com/questions/39577984/what-is-pkg-resources-0-0-0-in-output-of-pip-freeze-command
	setuptools
	wheel
)

# BASE_DIR and PROJECT_DIR should resolve to the same thing as in the django settings file
repo_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"

project_dir="$repo_dir/django-root"
base_dir="$project_dir/django_site"
static_dir="$repo_dir/assets"
frontend_dir="$repo_dir/frontend"

cd "$repo_dir"
