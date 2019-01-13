#!/bin/bash
# detect and resolve symlink
if [[ -L $0 ]]; then
	if [[ $(readlink $0) =~ ^(.*)/([^/]+)$ ]]; then
		WORKDIR="${BASH_REMATCH[1]}"
		CALLED="${BASH_REMATCH[2]}"
	fi
else
	if [[ $0 =~ ^(.*)/([^/]+)$ ]]; then
		WORKDIR="${BASH_REMATCH[1]}"
		CALLED="${BASH_REMATCH[2]}"
	fi
fi
source ${WORKDIR}/cmd
chain "${@}"
