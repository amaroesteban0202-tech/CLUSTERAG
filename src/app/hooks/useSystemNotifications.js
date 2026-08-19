import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiFetch } from "../lib/backend-api.js";
import { registerFirebaseWebPush } from "../lib/firebase-web-push.js";
import {
  NATIVE_CALL_CHANNEL,
  NATIVE_MESSAGE_CHANNEL,
  isNativeApp,
  playBrowserNotificationSound,
  scheduleNativeNotification,
} from "../lib/native-notifications.js";

export const useSystemNotifications = ({
  profileId,
  profileBlocked,
  browserNotificationPermission,
  setBrowserNotificationPermission,
  setNativePushReady,
  setNativeNotificationAction,
  webPushShownMessageIdsRef,
}) => {
  useEffect(() => {
    if (!profileId || profileBlocked) return;

    if (!isNativeApp()) {
      if (typeof Notification === "undefined") {
        setBrowserNotificationPermission("unsupported");
        return;
      }
      let disposed = false;
      const syncBrowserPermission = () => {
        if (!disposed) setBrowserNotificationPermission(Notification.permission);
      };
      const requestBrowserPermission = async () => {
        window.removeEventListener("pointerdown", requestBrowserPermission);
        window.removeEventListener("keydown", requestBrowserPermission);
        try {
          const permission = await Notification.requestPermission();
          if (!disposed) {
            setBrowserNotificationPermission(
              permission || Notification.permission,
            );
          }
        } catch {
          syncBrowserPermission();
        }
      };
      syncBrowserPermission();
      if (Notification.permission === "default") {
        window.addEventListener("pointerdown", requestBrowserPermission, {
          passive: true,
        });
        window.addEventListener("keydown", requestBrowserPermission);
      }
      window.addEventListener("focus", syncBrowserPermission);
      document.addEventListener("visibilitychange", syncBrowserPermission);
      return () => {
        disposed = true;
        window.removeEventListener("pointerdown", requestBrowserPermission);
        window.removeEventListener("keydown", requestBrowserPermission);
        window.removeEventListener("focus", syncBrowserPermission);
        document.removeEventListener("visibilitychange", syncBrowserPermission);
      };
    }

    let disposed = false;
    const handles = [];
    const addHandle = async (promise) => {
      const handle = await promise;
      if (disposed) handle?.remove?.();
      else handles.push(handle);
    };

    const configureNativeNotifications = async () => {
      if (Capacitor.getPlatform() === "android") {
        await Promise.all([
          LocalNotifications.createChannel({
            id: NATIVE_MESSAGE_CHANNEL,
            name: "Mensajes",
            description: "Mensajes nuevos del chat interno",
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: "default",
          }),
          LocalNotifications.createChannel({
            id: NATIVE_CALL_CHANNEL,
            name: "Llamadas",
            description: "Llamadas entrantes del equipo",
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: "default",
          }),
        ]);
      }

      let localPermission = await LocalNotifications.checkPermissions();
      if (localPermission.display === "prompt") {
        localPermission = await LocalNotifications.requestPermissions();
      }

      await addHandle(
        PushNotifications.addListener("registration", async ({ value }) => {
          if (disposed || !value) return;
          try {
            await apiFetch("/api/push/register", {
              method: "POST",
              body: JSON.stringify({
                token: value,
                platform: Capacitor.getPlatform(),
              }),
            });
            if (!disposed) setNativePushReady(true);
          } catch (error) {
            console.warn("[push:register]", error?.message || error);
            if (!disposed) setNativePushReady(false);
          }
        }),
      );
      await addHandle(
        PushNotifications.addListener("registrationError", (error) => {
          console.warn("[push:registration]", error?.error || error);
          if (!disposed) setNativePushReady(false);
        }),
      );
      await addHandle(
        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            const data = notification.data || {};
            window.dispatchEvent(
              new CustomEvent("cluster:push", {
                detail: { collections: ["client_chats"] },
              }),
            );
            void scheduleNativeNotification({
              title: notification.title || "Cluster Agency OS",
              body: notification.body || "Tienes una notificación nueva",
              data,
              isCall: data.type === "call",
            });
          },
        ),
      );
      await addHandle(
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          ({ notification }) =>
            setNativeNotificationAction(notification?.data || null),
        ),
      );
      await addHandle(
        LocalNotifications.addListener(
          "localNotificationActionPerformed",
          ({ notification }) =>
            setNativeNotificationAction(notification?.extra || null),
        ),
      );

      let pushPermission = await PushNotifications.checkPermissions();
      if (pushPermission.receive === "prompt") {
        pushPermission = await PushNotifications.requestPermissions();
      }
      if (pushPermission.receive === "granted") {
        await PushNotifications.register();
      }
    };

    configureNativeNotifications().catch((error) => {
      console.warn("[notifications:setup]", error?.message || error);
      if (!disposed) setNativePushReady(false);
    });
    return () => {
      disposed = true;
      handles.forEach((handle) => handle?.remove?.());
    };
  }, [
    profileId,
    profileBlocked,
    setBrowserNotificationPermission,
    setNativePushReady,
    setNativeNotificationAction,
  ]);

  useEffect(() => {
    if (
      isNativeApp() ||
      profileBlocked ||
      !profileId ||
      browserNotificationPermission !== "granted"
    )
      return;

    let disposed = false;
    let unsubscribe = null;
    registerFirebaseWebPush({
      onMessage: (payload, { serviceWorkerRegistration } = {}) => {
        const data = payload?.data || {};
        const title =
          data.title ||
          payload?.notification?.title ||
          "Cluster Agency OS";
        const body =
          data.body ||
          payload?.notification?.body ||
          "Tienes una notificación nueva";
        const messageId = String(data.messageId || "");
        if (messageId) webPushShownMessageIdsRef.current.add(messageId);
        playBrowserNotificationSound();
        serviceWorkerRegistration?.active?.postMessage({
          type: "cluster:show-notification",
          notification: { title, body, data },
        });
        window.dispatchEvent(
          new CustomEvent("cluster:push", {
            detail: { collections: ["client_chats"] },
          }),
        );
      },
    })
      .then(async (registration) => {
        if (!registration) return;
        if (disposed) {
          registration.unsubscribe?.();
          return;
        }
        unsubscribe = registration.unsubscribe;
        await apiFetch("/api/push/register", {
          method: "POST",
          body: JSON.stringify({
            token: registration.token,
            platform: "web",
          }),
        });
      })
      .catch((error) =>
        console.warn("[web-push:setup]", error?.message || error),
      );

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [
    profileId,
    profileBlocked,
    browserNotificationPermission,
    webPushShownMessageIdsRef,
  ]);
};
