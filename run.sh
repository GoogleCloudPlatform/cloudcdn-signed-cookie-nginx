#!/bin/bash
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
if [ x$NOUSESECRET = xy ]
then
  echo
else
  BASE=$(dirname $(readlink -f $0))
  source  <(python3 $BASE/fetcher.py ${SECRETNAME}|base64 -d)
fi
set -ex
echo SIGNKEY="??"
set +x
test -n "$SIGNKEY"
set -x
echo KEYNAME="$KEYNAME"
test -n "$KEYNAME"
echo DOMAIN="$DOMAIN"
test -n "$DOMAIN"
export EXPIRES="${EXPIRES:-1200}"
export LOCATION_REGEXP="${LOCATION_REGEXP:-.*}"
echo BACKEND_SERVER="$BACKEND_SERVER"
test -n "$BACKEND_SERVER"


envsubst '$BACKEND_SERVER $LOCATION_REGEXP'\
  < /etc/nginx/conf.d/default.conf.tmpl\
  > /etc/nginx/conf.d/default.conf

exec /usr/local/bin/docker-entrypoint.sh
