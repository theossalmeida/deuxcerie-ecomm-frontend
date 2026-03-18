#!/bin/bash
set -a
source .env.production
set +a

fly deploy \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  --build-arg NEXT_PUBLIC_R2_BASE_URL="$NEXT_PUBLIC_R2_BASE_URL" \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="$NEXT_PUBLIC_WHATSAPP_NUMBER"
