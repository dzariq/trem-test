#!/usr/bin/env bash
# Adds POST_NOTIFICATIONS + default FCM notification channel meta to the Capacitor app manifest.
set -euo pipefail

MANIFEST="${1:-android/app/src/main/AndroidManifest.xml}"
if [ ! -f "$MANIFEST" ]; then
  echo "FATAL: manifest not found at $MANIFEST"
  exit 1
fi

if ! grep -q 'android.permission.POST_NOTIFICATIONS' "$MANIFEST"; then
  perl -0777 -i -pe 's/(<manifest[^>]*>)/$1\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" \/>/s' "$MANIFEST"
  echo "Added POST_NOTIFICATIONS permission"
fi

if ! grep -q 'com.google.firebase.messaging.default_notification_channel_id' "$MANIFEST"; then
  perl -0777 -i -pe 's/(<application[^>]*>)/$1\n        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="trem_default" \/>/s' "$MANIFEST"
  echo "Added default_notification_channel_id meta-data"
fi

grep -q 'POST_NOTIFICATIONS' "$MANIFEST"
grep -q 'trem_default' "$MANIFEST"
echo "AndroidManifest push patches OK"
