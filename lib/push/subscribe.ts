"use client";

import { requireVapidPublicKey, urlBase64ToUint8Array } from "@/lib/push/vapid";

export async function createPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este dispositivo no soporta Web Push.");
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const vapidKey = requireVapidPublicKey();
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}
