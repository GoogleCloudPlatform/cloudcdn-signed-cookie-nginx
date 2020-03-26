#!/usr/bin/env python3
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

from urllib import request
import json

def get_project_id():
  req = request.Request("http://metadata.google.internal/computeMetadata/v1/project/project-id")
  req.add_header("Metadata-Flavor", "Google")
  r = request.urlopen(req)
  d = r.read().decode("utf8")
  return d

def get_access_token():
  req = request.Request("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token")
  req.add_header("Metadata-Flavor", "Google")
  r = request.urlopen(req)
  d = r.read().decode("utf8")
  return json.loads(d)["access_token"]

def get_secret(secret, token, projectid):
  req = request.Request("https://secretmanager.googleapis.com/v1/projects/%s/secrets/%s/versions/1:access"%(projectid, secret))
  req.add_header("Authorization", "Bearer %s"%token)
  req.add_header("Content-Type","application/json")
  req.add_header("X-Goog-User-Project", projectid)
  r = request.urlopen(req)
  d = json.loads(r.read().decode("utf8"))
  return d["payload"]["data"]

def main():
  import sys
  if len(sys.argv) < 2:
    print("secret is missing")
    print("Usage: %s secret"%sys.argv[0])
    return 1
  secret = sys.argv[1]
  prj = get_project_id()
  token = get_access_token()
  s = get_secret(secret, token, prj)
  print(s)
  return 0

if __name__ == "__main__":
  sys.exit(main())
