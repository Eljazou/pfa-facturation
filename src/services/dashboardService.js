// Pure functions — no React, no Firebase. All inputs are arrays of invoice/client objects.

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_COLORS = {
  validated: '#1E7145',
  pending:   '#C55A00',
  rejected:  '#C00000',
  paid:      '#2E75B6',
  draft:     '#595959',
};

const STATUS_LABELS = {
  validated: 'Validées',
  pending:   'En attente',
  rejected:  'Rejetées',
  paid:      'Payées',
  draft:     'Brouillons',
};

const sum = (arr, fn) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
const num = (v) => Number(v) || 0;

// ── Filter helpers ────────────────────────────────────────────────────────────

export function filterInvoices(invoices, { dateFrom, dateTo, agentId, devise } = {}) {
  return invoices.filter((inv) => {
    if (dateFrom && inv.date_creation && inv.date_creation < dateFrom) return false;
    if (dateTo   && inv.date_creation && inv.date_creation > dateTo)   return false;
    if (agentId  && inv.userId !== agentId) return false;
    if (devise   && inv.devise && inv.devise !== devise) return false;
    return true;
  });
}

// ── KPI computers ─────────────────────────────────────────────────────────────

function baseKPIs(invoices) {
  const total_factures   = invoices.length;
  const total_en_attente = invoices.filter((i) => i.statut === 'pending').length;
  const total_validees   = invoices.filter((i) => i.statut === 'validated').length;
  const total_rejetees   = invoices.filter((i) => i.statut === 'rejected').length;
  const total_payees     = invoices.filter((i) => i.statut === 'paid').length;
  const total_brouillons = invoices.filter((i) => i.statut === 'draft').length;

  const montant_total_ttc  = sum(invoices, (i) => i.total_ttc);
  const montant_encaisse   = sum(invoices.filter((i) => i.statut === 'paid'),    (i) => i.total_ttc);
  const montant_en_attente = sum(invoices.filter((i) => i.statut === 'pending'), (i) => i.total_ttc);

  return {
    total_factures,
    total_en_attente,
    total_validees,
    total_rejetees,
    total_payees,
    total_brouillons,
    montant_total_ttc,
    montant_encaisse,
    montant_en_attente,
    moyenne_facture: total_factures ? montant_total_ttc / total_factures : 0,
  };
}

export function computeUserKPIs(invoices, userId) {
  const mine = invoices.filter((i) => i.userId === userId);
  return baseKPIs(mine);
}

export function computeAdminKPIs(invoices) {
  const base = baseKPIs(invoices);

  const clientIds = new Set(invoices.map((i) => i.client_id || i.client_nom).filter(Boolean));
  const agentIds  = new Set(invoices.map((i) => i.userId).filter(Boolean));

  const taux_validation = base.total_factures
    ? (base.total_validees / base.total_factures) * 100
    : 0;
  const taux_rejet = base.total_factures
    ? (base.total_rejetees / base.total_factures) * 100
    : 0;

  // Top client by total paid amount
  const byClient = new Map();
  invoices
    .filter((i) => i.statut === 'paid')
    .forEach((i) => {
      const key = i.client_id || i.client_nom || 'Inconnu';
      const prev = byClient.get(key) || { client_id: key, total_ttc: 0, count: 0 };
      prev.total_ttc += num(i.total_ttc);
      prev.count += 1;
      byClient.set(key, prev);
    });
  let top_client = null;
  byClient.forEach((v) => { if (!top_client || v.total_ttc > top_client.total_ttc) top_client = v; });

  return {
    ...base,
    total_clients_actifs: clientIds.size,
    total_agents:         agentIds.size,
    taux_validation,
    taux_rejet,
    top_client,
  };
}

// ── Chart data builders ───────────────────────────────────────────────────────

export function buildMonthlyRevenueData(invoices, year) {
  const buckets = MONTHS_FR.map((m) => ({ month: m, revenue: 0, count: 0 }));
  invoices
    .filter((i) => i.statut === 'paid')
    .forEach((i) => {
      const dateStr = i.date_encaissement || i.validated_at || i.date_creation;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      if (year && d.getFullYear() !== year) return;
      buckets[d.getMonth()].revenue += num(i.total_ttc);
      buckets[d.getMonth()].count += 1;
    });
  return buckets;
}

export function buildStatusDistributionData(invoices) {
  const counts = { validated: 0, pending: 0, rejected: 0, paid: 0, draft: 0 };
  invoices.forEach((i) => {
    if (counts[i.statut] !== undefined) counts[i.statut] += 1;
  });
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([statut, value]) => ({
      key: statut,
      name: STATUS_LABELS[statut],
      value,
      color: STATUS_COLORS[statut],
    }));
}

export function buildMonthlyTrendData(invoices, months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const buckets = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    buckets.push({
      key:    `${d.getFullYear()}-${d.getMonth()}`,
      month:  MONTHS_FR[d.getMonth()],
      created: 0,
      validated: 0,
      rejected: 0,
    });
  }
  const indexByKey = new Map(buckets.map((b, idx) => [b.key, idx]));

  invoices.forEach((i) => {
    if (!i.date_creation) return;
    const d = new Date(i.date_creation);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = indexByKey.get(key);
    if (idx === undefined) return;
    buckets[idx].created += 1;
    if (i.statut === 'validated' || i.statut === 'paid') buckets[idx].validated += 1;
    if (i.statut === 'rejected') buckets[idx].rejected += 1;
  });

  return buckets;
}

export function buildTopClientsData(invoices, clients = [], limit = 5) {
  const byClient = new Map();
  invoices
    .filter((i) => i.statut === 'paid')
    .forEach((i) => {
      const key = i.client_id || i.client_nom || 'Inconnu';
      const prev = byClient.get(key) || { id: key, name: i.client_nom || key, total: 0, count: 0 };
      prev.total += num(i.total_ttc);
      prev.count += 1;
      if (!prev.name && i.client_nom) prev.name = i.client_nom;
      byClient.set(key, prev);
    });

  const clientNameById = new Map((clients || []).map((c) => [c.id, c.nom]));
  const arr = Array.from(byClient.values()).map((v) => ({
    ...v,
    client: clientNameById.get(v.id) || v.name || v.id,
  }));

  return arr.sort((a, b) => b.total - a.total).slice(0, limit);
}

export function buildRecentActivity(invoices, limit = 10) {
  const events = [];
  invoices.forEach((i) => {
    if (i.created_at) events.push({
      id: `${i.id}-c`, type: 'created', invoiceId: i.id, numero: i.numero,
      userId: i.userId, at: i.created_at,
    });
    if (i.date_depot) events.push({
      id: `${i.id}-s`, type: 'submitted', invoiceId: i.id, numero: i.numero,
      userId: i.userId, at: i.date_depot,
    });
    if (i.validated_at) events.push({
      id: `${i.id}-v`, type: 'validated', invoiceId: i.id, numero: i.numero,
      userId: i.validated_by || i.userId, at: i.validated_at,
    });
    if (i.rejected_at) events.push({
      id: `${i.id}-r`, type: 'rejected', invoiceId: i.id, numero: i.numero,
      userId: i.rejected_by || i.userId, at: i.rejected_at,
    });
    if (i.date_encaissement) events.push({
      id: `${i.id}-p`, type: 'paid', invoiceId: i.id, numero: i.numero,
      userId: i.userId, at: i.date_encaissement,
    });
  });
  return events
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    .slice(0, limit);
}

// ── Overdue ───────────────────────────────────────────────────────────────────

export function computeOverdueStatus(invoice, todayISO) {
  if (!invoice) return { isOverdue: false, daysOverdue: 0 };
  if (!['pending', 'validated'].includes(invoice.statut)) {
    return { isOverdue: false, daysOverdue: 0 };
  }
  const ref = invoice.date_depot || invoice.date_creation;
  if (!ref) return { isOverdue: false, daysOverdue: 0 };
  const refDate = new Date(ref);
  const today = todayISO ? new Date(todayISO) : new Date();
  const days = Math.floor((today.getTime() - refDate.getTime()) / 86_400_000);
  if (days > 30) return { isOverdue: true, daysOverdue: days - 30 };
  return { isOverdue: false, daysOverdue: 0 };
}

export function countOverdue(invoices, todayISO) {
  return invoices.filter((i) => computeOverdueStatus(i, todayISO).isOverdue).length;
}
