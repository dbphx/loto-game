#!/bin/bash
export LC_ALL=C

BASE_URL="https://loto-api.insky.fun/rooms/create"
TOTAL=20

random_id() {
  local chars="abcdefghijklmnopqrstuvwxyz0123456789"
  local id=""
  for i in {1..6}; do
    id="$id${chars:RANDOM%${#chars}:1}"
  done
  echo "$id"
}

for i in $(seq 1 $TOTAL); do
  ID=$(random_id)
  USER="user-$((100000 + RANDOM % 900000))"
  SECRET="x"

  URL="$BASE_URL?id=$ID&user=$USER&secret=$SECRET"

  echo "➡️  Request $i | id=$ID user=$USER"

  curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}s\n" \
    -X POST "$URL"

  echo "-----------------------------"
done
