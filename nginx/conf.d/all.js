// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var crypto = require('crypto');

function padding(s) {
  var n = s.length %4;
  if ( n == 0 ) {
    return s;
  };
  if ( n == 1 ) {
    return s + "===";
  };
  if ( n == 2 ) {
    return s + "==";
  };
  if ( n == 3 ) {
    return s + "=";
  };
}

function sign_cookie(keyname, expires, prefix) {
  var key = String.bytesFrom(process.env["SIGNKEY"], "base64");
  var cookie_data = `URLPrefix=${prefix}:Expires=${expires}:KeyName=${keyname}`;
  var hmac = crypto.createHmac("sha1", key);
  hmac.update(cookie_data);
  var signature = padding(hmac.digest("base64url"));
  return `${cookie_data}:Signature=${signature}`
}


function gen_cookie(r) {

  var keyname = process.env["KEYNAME"];
  var expires = parseInt(process.env["EXPIRES"]) + Math.floor(Date.now()/1000);
  var domain = process.env["DOMAIN"];

  var prefix = r.args["prefix"]

  var cookie = `Cloud-CDN-Cookie=${sign_cookie(keyname, expires, prefix)}; `;
  cookie += `Domain=${domain}; `
  cookie += `Path=/; `
  cookie += `Expires=${(new Date(expires*1000)).toString()}`;
  return cookie;
}

function sign_url(keyname, url) {
  var key = String.bytesFrom(process.env["SIGNKEY"], "base64");
  var hmac = crypto.createHmac("sha1", key);
  hmac.update(url);
  var signature = padding(hmac.digest("base64url"));
  return signature;
}

// inbound requests should have a URL:
// http[s]://host.domain/path/to/resource?args1=value1[...]&keyname=KEYNAME&prefix=PREFIX&expires=EXPIRES&signature=SIGNATURE
// KEYNAME: the generated signed cookie should use this keyname
// PREFIX: the generate signed cookie should use this as URLPrefix
//
// Return 0 will let nginx response 2xx, otherwise nginx will response 403
function check_inbound_request(r) {
  var scheme = r.variables["scheme"];
  var host = r.variables["host"];
  var request_uri = r.variables["request_uri"];

  var url_full = `${scheme}://${host}${request_uri}`

  var url_splits = url_full.split("keyname=", 2);

  if (url_splits.length < 2) {
    r.error("no keyname");
    return 0;
  }

  var keyname = r.args["keyname"];
  if (!(parseInt(r.args["expires"]) > Date.now()/1000)) {
    r.error(`EXPIRE: ${r.args["expires"]}: expired`);
    return 0;
  }

  var expires = r.args["expires"];

  var signature = r.args["signature"];
  var url_to_sign_temp = url_splits[0];

  var first_sep = "&";
  if ( url_to_sign_temp[url_to_sign_temp.length-1] == "?") {
    first_sep = ""
  }
  var url_to_sign = `${url_to_sign_temp}${first_sep}keyname=${keyname}&prefix=${r.args["prfix"]}&expires=${expires}`

  var sig = sign_url(keyname, url_to_sign);
  if (signature != sig) {
    r.error(`${url_to_sign}&signaure=${signature} signaure mismatch: ${sig}`);
    return 0;
  }

  return 1;
}
