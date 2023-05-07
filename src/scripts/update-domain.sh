#!/bin/bash
# import .env
# make sure there are no spaces in values (wrap with "")
set -o allexport; source .env; set +o allexport

IP=161.35.204.54

for id in $DIGITALOCEAN_DOMAIN_RECORD_IDS; do
  data="{\"data\":\"$IP\"}"
  echo "Patching https://api.digitalocean.com/v2/domains/hermes-mp3.ro/records/$id with $data"
  curl -X PATCH \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
    -d $data \
    "https://api.digitalocean.com/v2/domains/hermes-mp3.ro/records/$id"
  echo
done