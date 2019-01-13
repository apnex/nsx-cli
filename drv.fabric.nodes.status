#!/bin/bash
if [[ $0 =~ ^(.*)/[^/]+$ ]]; then
	WORKDIR=${BASH_REMATCH[1]}
fi
source ${WORKDIR}/drv.nsx.client
source ${WORKDIR}/drv.core
INPUTS=("${@}")

## status of node
function getStatus {
	local NODEID=${1}
	ITEM="fabric/nodes"
	CALL="/${NODEID}/status"
	URL=$(buildURL "${ITEM}${CALL}")
	if [[ -n "${URL}" ]]; then
		printf "[$(cgreen "INFO")]: nsx [$(cgreen "status")] ${ITEM} [$(cgreen "$URL")]... " 1>&2
		nsxGet "${URL}"
	fi
}

ID="${INPUTS[0]}"
getStatus "${ID}"

