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

FROM launcher.gcr.io/google/nginx1:latest
RUN set -x \
    && apt-get update \
    && apt-get install -y python3 \
    && rm -fr /var/lib/apt/lists

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d /etc/nginx/conf.d/
COPY fetcher.py /root/fetcher.py
COPY run.sh /root/run.sh

RUN chmod +x /root/run.sh /root/fetcher.py
EXPOSE 80
ENTRYPOINT ["/root/run.sh"]