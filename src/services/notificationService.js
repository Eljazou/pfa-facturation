import { ref, push, update, remove } from 'firebase/database';
import { db } from '../config/firebase';

const MESSAGES = {
  invoice_submitted:        (inv) => `Nouvelle facture ${inv.numero} soumise pour validation`,
  invoice_validated:        (inv) => `Facture ${inv.numero} validée${inv.email_sent ? ' — email client envoyé' : ''}`,
  invoice_validated_admin:  (inv) => `Vous avez validé la facture ${inv.numero}${inv.email_sent ? ' — email client envoyé' : ' — email non envoyé'}`,
  invoice_rejected:         (inv) => `Facture ${inv.numero} rejetée : ${inv.rejection_reason || ''}`,
  invoice_rejected_admin:   (inv) => `Vous avez rejeté la facture ${inv.numero} : ${inv.rejection_reason || ''}`,
  invoice_paid:             (inv) => `Facture ${inv.numero} marquée comme payée`,
};

export async function triggerNotification(type, invoiceData, targetUserId) {
  if (!targetUserId) return;
  const builder = MESSAGES[type];
  if (!builder) throw new Error(`Unknown notification type: ${type}`);

  const payload = {
    type,
    message: builder(invoiceData),
    invoiceId: invoiceData.id,
    invoiceNumero: invoiceData.numero,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await push(ref(db, `notifications/${targetUserId}`), payload);
}

const bucketPath = (userId, notif) =>
  notif.bucket === 'admin' ? 'admin' : userId;

export async function markNotificationRead(userId, notif) {
  const bucket = bucketPath(userId, notif);
  await update(ref(db, `notifications/${bucket}/${notif.id}`), { read: true });
}

export async function markAllNotificationsRead(userId, notifications) {
  const updates = {};
  notifications.filter((n) => !n.read).forEach((n) => {
    const bucket = bucketPath(userId, n);
    updates[`notifications/${bucket}/${n.id}/read`] = true;
  });
  if (Object.keys(updates).length) await update(ref(db), updates);
}

export async function deleteNotification(userId, notif) {
  const bucket = bucketPath(userId, notif);
  await remove(ref(db, `notifications/${bucket}/${notif.id}`));
}
