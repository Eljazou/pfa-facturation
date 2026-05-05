import * as XLSX from 'xlsx';

const STATUS_LABEL = {
  draft: 'Brouillon',
  pending: 'En attente',
  validated: 'Validée',
  rejected: 'Rejetée',
  paid: 'Payée',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

export function exportInvoicesToExcel(invoices, clients = [], filename = 'factures.xlsx') {
  const clientById = new Map((clients || []).map((c) => [c.id, c.nom]));

  const rows = invoices.map((i) => ({
    'Numéro':       i.numero || '',
    'Date':         fmtDate(i.date_creation),
    'Client':       clientById.get(i.client_id) || i.client_nom || '',
    'Agent':        i.userId || '',
    'Méthode':      i.billing_method || '',
    'Total HT':     Number(i.total_ht || 0).toFixed(2),
    'TVA':          Number(i.tva_montant || 0).toFixed(2),
    'Total TTC':    Number(i.total_ttc || 0).toFixed(2),
    'Devise':       i.devise || 'MAD',
    'Statut':       STATUS_LABEL[i.statut] || i.statut || '',
    'Date paiement': fmtDate(i.date_encaissement),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
  ];

  // Style header row (cell-level styles, ignored without xlsx-style; widths/format still applied)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let c = headerRange.s.c; c <= headerRange.e.c; c += 1) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1976D2' } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Factures');
  XLSX.writeFile(wb, filename);
}

export function exportKPIsToExcel(kpis, { month, year, devise = 'MAD' } = {}, filename) {
  const rows = [
    { Indicateur: 'Total factures',         Valeur: kpis.total_factures,        Devise: '' },
    { Indicateur: 'Factures en attente',    Valeur: kpis.total_en_attente,      Devise: '' },
    { Indicateur: 'Factures validées',      Valeur: kpis.total_validees,        Devise: '' },
    { Indicateur: 'Factures rejetées',      Valeur: kpis.total_rejetees,        Devise: '' },
    { Indicateur: 'Factures payées',        Valeur: kpis.total_payees,          Devise: '' },
    { Indicateur: 'Montant total TTC',      Valeur: Number(kpis.montant_total_ttc).toFixed(2),  Devise: devise },
    { Indicateur: 'Montant encaissé',       Valeur: Number(kpis.montant_encaisse).toFixed(2),   Devise: devise },
    { Indicateur: 'Montant en attente',     Valeur: Number(kpis.montant_en_attente).toFixed(2), Devise: devise },
    { Indicateur: 'Moyenne par facture',    Valeur: Number(kpis.moyenne_facture).toFixed(2),    Devise: devise },
  ];
  if (kpis.total_clients_actifs !== undefined) {
    rows.push(
      { Indicateur: 'Clients actifs',     Valeur: kpis.total_clients_actifs, Devise: '' },
      { Indicateur: 'Agents actifs',      Valeur: kpis.total_agents,         Devise: '' },
      { Indicateur: 'Taux de validation', Valeur: `${Number(kpis.taux_validation).toFixed(1)}%`, Devise: '' },
      { Indicateur: 'Taux de rejet',      Valeur: `${Number(kpis.taux_rejet).toFixed(1)}%`,      Devise: '' },
    );
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  const period = [month, year].filter(Boolean).join('-') || new Date().toISOString().slice(0, 7);
  XLSX.utils.book_append_sheet(wb, ws, `KPI ${period}`);
  XLSX.writeFile(wb, filename || `kpi_${period}.xlsx`);
}
