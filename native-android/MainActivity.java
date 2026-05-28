package com.tremendousinc.trem;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Trem test shell: FCM topic subscribe + notification permission + token for debugging.
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "TremNav";
    private static final String TOPIC = "trem_test";
    private static final String CHANNEL_ID = "trem_default";
    private static final int REQ_POST_NOTIFICATIONS = 9001;

    private volatile String lastPushTopic = TOPIC;
    private volatile Boolean lastPushOk = null;
    private volatile String lastPushError = null;

    private void rememberPushResult(String topic, Boolean ok, String error) {
        lastPushTopic = topic;
        lastPushOk = ok;
        lastPushError = error;
    }

    private String jsEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void emitLog(String message) {
        try {
            if (this.bridge == null || this.bridge.getWebView() == null) return;
            String safeMsg = jsEscape(message);
            String js =
                "window.__tremLogs = window.__tremLogs || [];" +
                "window.__tremLogs.push({ ts: Date.now(), msg: \"" + safeMsg + "\" });" +
                "window.dispatchEvent(new CustomEvent('tremLog', { detail: { ts: Date.now(), msg: \"" + safeMsg + "\" } }));";
            this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript(js, null));
        } catch (Throwable ignored) {}
    }

    private void emitPushStatus(String topic, boolean ok, String error) {
        try {
            if (this.bridge == null || this.bridge.getWebView() == null) return;
            String safeError = jsEscape(error);
            String js =
                "window.__tremPush = {" +
                "topic: \"" + jsEscape(topic) + "\"," +
                "ok: " + (ok ? "true" : "false") + "," +
                "error: \"" + safeError + "\"," +
                "ts: Date.now()" +
                "};" +
                "window.dispatchEvent(new CustomEvent('tremPush', { detail: window.__tremPush }));";
            this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript(js, null));
        } catch (Throwable ignored) {}
    }

    private void emitFcmToken(String token) {
        try {
            if (this.bridge == null || this.bridge.getWebView() == null) return;
            String safe = jsEscape(token);
            String js =
                "window.__tremFcmToken = \"" + safe + "\";" +
                "window.dispatchEvent(new CustomEvent('tremToken', { detail: { token: \"" + safe + "\" } }));";
            this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript(js, null));
        } catch (Throwable ignored) {}
    }

    private void emitNotifPerm(boolean granted) {
        try {
            if (this.bridge == null || this.bridge.getWebView() == null) return;
            String js =
                "window.__tremNotifPerm = " + (granted ? "true" : "false") + ";" +
                "window.dispatchEvent(new CustomEvent('tremNotifPerm', { detail: { granted: " + granted + " } }));";
            this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript(js, null));
        } catch (Throwable ignored) {}
    }

    private void emitPushStatusWhenReady() {
        try {
            if (this.bridge == null || this.bridge.getWebView() == null) return;
            final int[] tries = {0};
            final Runnable r = new Runnable() {
                @Override public void run() {
                    tries[0]++;
                    try {
                        if (bridge == null || bridge.getWebView() == null) return;
                        String url = bridge.getWebView().getUrl();
                        if (url == null || url.length() == 0) {
                            if (tries[0] < 20) bridge.getWebView().postDelayed(this, 350);
                            return;
                        }
                        if (lastPushOk == null) {
                            emitPushStatus(lastPushTopic, false, "Subscribe not completed yet");
                        } else {
                            emitPushStatus(lastPushTopic, lastPushOk.booleanValue(), lastPushError);
                        }
                    } catch (Throwable ignored) {}
                }
            };
            bridge.getWebView().postDelayed(r, 350);
        } catch (Throwable ignored) {}
    }

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Trem notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("FCM push notifications for Trem");
            nm.createNotificationChannel(ch);
            emitLog("Notification channel created: " + CHANNEL_ID);
        } catch (Throwable e) {
            emitLog("Notification channel error: " + e);
        }
    }

    private boolean hasPostNotificationsPermission() {
        if (Build.VERSION.SDK_INT < 33) return true;
        return ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPostNotificationsIfNeeded() {
        if (Build.VERSION.SDK_INT < 33) {
            emitNotifPerm(true);
            emitLog("POST_NOTIFICATIONS not required (API < 33)");
            return;
        }
        if (hasPostNotificationsPermission()) {
            emitNotifPerm(true);
            emitLog("POST_NOTIFICATIONS already granted");
            return;
        }
        emitLog("Requesting POST_NOTIFICATIONS …");
        ActivityCompat.requestPermissions(
            this,
            new String[] { Manifest.permission.POST_NOTIFICATIONS },
            REQ_POST_NOTIFICATIONS
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_POST_NOTIFICATIONS) return;
        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        emitNotifPerm(granted);
        emitLog(granted ? "POST_NOTIFICATIONS granted" : "POST_NOTIFICATIONS denied — pushes may not show");
        if (granted) fetchFcmToken();
    }

    private void fetchFcmToken() {
        try {
            Class<?> cls = Class.forName("com.google.firebase.messaging.FirebaseMessaging");
            Object inst = cls.getMethod("getInstance").invoke(null);
            Object task = cls.getMethod("getToken").invoke(inst);
            task.getClass().getMethod("addOnCompleteListener", java.util.concurrent.Executor.class,
                    Class.forName("com.google.android.gms.tasks.OnCompleteListener"))
                .invoke(task,
                    java.util.concurrent.Executors.newSingleThreadExecutor(),
                    java.lang.reflect.Proxy.newProxyInstance(
                        Class.forName("com.google.android.gms.tasks.OnCompleteListener").getClassLoader(),
                        new Class[] { Class.forName("com.google.android.gms.tasks.OnCompleteListener") },
                        (proxy, method, args) -> {
                            if ("onComplete".equals(method.getName()) && args != null && args.length == 1) {
                                try {
                                    Object t = args[0];
                                    boolean ok = (boolean) t.getClass().getMethod("isSuccessful").invoke(t);
                                    if (ok) {
                                        String token = (String) t.getClass().getMethod("getResult").invoke(t);
                                        Log.i(TAG, "FCM token: " + token);
                                        emitLog("FCM token received (see UI)");
                                        emitFcmToken(token);
                                    } else {
                                        Object ex = t.getClass().getMethod("getException").invoke(t);
                                        emitLog("FCM getToken failed: " + ex);
                                    }
                                } catch (Throwable ex) {
                                    emitLog("FCM getToken callback error: " + ex);
                                }
                            }
                            return null;
                        }
                    )
                );
        } catch (Throwable e) {
            emitLog("FCM getToken not available: " + e);
        }
    }

    private void subscribeToTremTestTopic() {
        try {
            emitLog("Attempting subscribeToTopic(" + TOPIC + ") …");
            Class<?> cls = Class.forName("com.google.firebase.messaging.FirebaseMessaging");
            Object inst = cls.getMethod("getInstance").invoke(null);
            Object task = cls.getMethod("subscribeToTopic", String.class).invoke(inst, TOPIC);
            task.getClass().getMethod("addOnCompleteListener", java.util.concurrent.Executor.class,
                    Class.forName("com.google.android.gms.tasks.OnCompleteListener"))
                .invoke(task,
                    java.util.concurrent.Executors.newSingleThreadExecutor(),
                    java.lang.reflect.Proxy.newProxyInstance(
                        Class.forName("com.google.android.gms.tasks.OnCompleteListener").getClassLoader(),
                        new Class[] { Class.forName("com.google.android.gms.tasks.OnCompleteListener") },
                        (proxy, method, args) -> {
                            if ("onComplete".equals(method.getName()) && args != null && args.length == 1) {
                                try {
                                    Object t = args[0];
                                    boolean ok = (boolean) t.getClass().getMethod("isSuccessful").invoke(t);
                                    if (ok) {
                                        Log.i(TAG, "Subscribed to topic " + TOPIC);
                                        emitLog("Subscribed to topic " + TOPIC + " (native)");
                                        rememberPushResult(TOPIC, true, null);
                                        emitPushStatusWhenReady();
                                    } else {
                                        Object ex = t.getClass().getMethod("getException").invoke(t);
                                        Log.w(TAG, "Subscribe to topic " + TOPIC + " failed: " + ex);
                                        emitLog("Subscribe failed: " + ex);
                                        rememberPushResult(TOPIC, false, String.valueOf(ex));
                                        emitPushStatusWhenReady();
                                    }
                                } catch (Throwable ex) {
                                    rememberPushResult(TOPIC, false, String.valueOf(ex));
                                    emitPushStatusWhenReady();
                                }
                            }
                            return null;
                        }
                    )
                );
        } catch (Throwable e) {
            Log.w(TAG, "FirebaseMessaging not available; skipped topic subscribe", e);
            emitLog("FirebaseMessaging not available: " + e);
            rememberPushResult(TOPIC, false, "FirebaseMessaging not available");
            emitPushStatusWhenReady();
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ensureNotificationChannel();
        requestPostNotificationsIfNeeded();
        if (hasPostNotificationsPermission()) {
            fetchFcmToken();
        }

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (lastPushOk == null) {
                rememberPushResult(TOPIC, false, "Waiting for subscribe result");
                emitLog("Timeout waiting for subscribe completion; emitting fallback status");
                emitPushStatusWhenReady();
            }
        }, 2500);

        subscribeToTremTestTopic();
    }
}
