let worker;
async function notificationWorker() {
  if (!('serviceWorker' in navigator)) return null;
  if (!worker) worker = navigator.serviceWorker.register('/notification-sw.js').then(async () => {
    let timeout;
    try {
      return await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('通知暂未就绪')), 5000); })]);
    } finally { clearTimeout(timeout); }
  }).catch(() => { worker = null; return null; });
  return worker;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') await notificationWorker();
  return permission;
}

export async function showReminderNotification(record, stillDue = () => true) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const options = { body: (record.text || '你设的提醒到点啦').slice(0, 80), tag: `reminder-${record.id}`, data: { recordId: record.id } };
    const registration = await notificationWorker();
    if (!stillDue()) return false;
    if (registration) await registration.showNotification('臭脑子 · 别忘了', options);
    else new Notification('臭脑子 · 别忘了', options);
    return true;
  } catch { return false; }
}
