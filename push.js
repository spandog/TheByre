// Handles asking for notification permission and registering this device
// with Supabase so the daily reminder job can reach it. Standard Web Push
// (VAPID), not Firebase — one less account to set up, and it works the
// same way across browsers.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!window.sb || !window.VAPID_PUBLIC_KEY || window.VAPID_PUBLIC_KEY.indexOf('YOUR_') === 0) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(window.VAPID_PUBLIC_KEY),
    });
  }
  const json = sub.toJSON();
  const { data: userData } = await window.sb.auth.getUser();
  if (!userData || !userData.user) return false;

  await window.sb.from('push_subscriptions').upsert({
    user_id: userData.user.id,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth_key: json.keys.auth,
  }, { onConflict: 'endpoint' });

  return true;
}

// Called from layout.js once we know someone is signed in, so the "Enable
// notifications" control only shows when it's actually useful.
async function notificationsStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
