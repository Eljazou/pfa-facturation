import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';

const yearOf = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getFullYear();
};

export async function archiveYear(year) {
  const snap = await get(ref(db, 'factures'));
  const raw = snap.val() || {};
  const updates = {};
  let archived_count = 0;
  let total_amount   = 0;

  Object.entries(raw).forEach(([id, inv]) => {
    if (yearOf(inv.date_creation) !== year) return;
    if (!['paid', 'validated'].includes(inv.statut)) return;
    if (inv.archived_year === year) return; // already archived
    updates[`factures/${id}/archived_year`] = year;
    updates[`factures/${id}/archived_at`]   = new Date().toISOString();
    archived_count += 1;
    total_amount   += Number(inv.total_ttc) || 0;
  });

  if (Object.keys(updates).length) {
    await update(ref(db), updates);
  }
  return { archived_count, total_amount };
}

export async function getArchivedInvoices(year) {
  const q = query(ref(db, 'factures'), orderByChild('archived_year'), equalTo(year));
  const snap = await get(q);
  const raw = snap.val() || {};
  return Object.entries(raw).map(([id, v]) => ({ id, ...v }));
}

export async function getAvailableArchiveYears() {
  const snap = await get(ref(db, 'factures'));
  const raw = snap.val() || {};
  const years = new Set();
  Object.values(raw).forEach((inv) => {
    if (inv.archived_year) years.add(inv.archived_year);
  });
  return Array.from(years).sort((a, b) => b - a);
}

export function countArchivableForYear(invoices, year) {
  return invoices.filter((i) =>
    yearOf(i.date_creation) === year &&
    ['paid', 'validated'].includes(i.statut) &&
    i.archived_year !== year
  );
}
