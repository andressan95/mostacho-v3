export function requireVapidPublicKey() {
  const value = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY debe estar configurada para habilitar notificaciones push.",
    );
  }
  return value;
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
