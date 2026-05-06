import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Constants ─────────────────────────────────────────────────────────────────

const MARGIN     = 14;
const PAGE_W     = 210;
const PAGE_H     = 297;
const TABLE_W    = PAGE_W - MARGIN * 2;   // 182 mm
const RIGHT_EDGE = PAGE_W - MARGIN;       // 196 mm
const FOOTER_TOP = 272;
const PRIMARY    = [30, 78, 121];

// Column widths must sum to TABLE_W = 182
const COL = { desc: 72, qty: 12, price: 30, disc: 18, tva: 16, total: 34 };

const FONT = 'helvetica';

// ── Text helpers ──────────────────────────────────────────────────────────────

// Pure ASCII formatting avoids any residual encoding issues.
export function formatAmount(amount, devise = 'MAD') {
  const num = Number(amount ?? 0);
  const abs = Math.abs(num).toFixed(2);
  const [intPart, dec] = abs.split('.');
  const thousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${num < 0 ? '-' : ''}${thousands}.${dec} ${devise}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Strip characters outside printable ASCII (0x20–0x7E) to be safe with any font.
function safe(str) {
  if (!str) return '--';
  return String(str).replace(/[^\x20-\x7E]/g, '');
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

export function drawLine(doc, y, color = [200, 200, 200]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, RIGHT_EDGE, y);
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
}

export function drawRect(doc, x, y, w, h, rgb) {
  doc.setFillColor(...rgb);
  doc.rect(x, y, w, h, 'F');
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:     { label: 'BROUILLON',  rgb: [120, 120, 120] },
  pending:   { label: 'EN ATTENTE', rgb: [245, 124,   0] },
  validated: { label: 'VALIDEE',    rgb: [ 46, 125,  50] },
  rejected:  { label: 'REJETEE',    rgb: [211,  47,  47] },
  paid:      { label: 'PAYEE',      rgb: [  2, 136, 209] },
};

const BILLING_LABELS = {
  simple:          'Simple (TVA 20%)',
  line_discount:   'Remise par ligne',
  global_discount: 'Remise globale',
  category_tva:    'TVA par categorie',
};

// ── Main generator ────────────────────────────────────────────────────────────

export async function generatePDF(invoiceData, clientData, companyData, signatureBase64) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Symbol must be ASCII-safe (database might store Arabic dirham chars)
  const rawSymbol = invoiceData.devise_symbol || invoiceData.devise || 'MAD';
  const symbol = /^[\x20-\x7E]+$/.test(rawSymbol) ? rawSymbol : 'MAD';

  // ── QR code ──────────────────────────────────────────────────────────────
  const QRCode = (await import('qrcode')).default;
  const envBase = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PUBLIC_URL : '') || '';
  const origin = envBase
    ? envBase.replace(/\/$/, '')
    : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  const qrValue = invoiceData.id
    ? `${origin}/invoices/${invoiceData.id}`
    : (invoiceData.numero || '');
  const qrBase64 = await QRCode.toDataURL(qrValue, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  // ── SECTION 1: Company header ─────────────────────────────────────────────
  let y = 16;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text(safe(companyData?.company_name) || 'Mon Entreprise', MARGIN, y);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  y += 5;
  if (companyData?.company_address) { doc.text(safe(companyData.company_address), MARGIN, y); y += 4; }
  if (companyData?.company_phone)   { doc.text(`Tel : ${safe(companyData.company_phone)}`, MARGIN, y); y += 4; }
  if (companyData?.company_email)   { doc.text(`Email : ${safe(companyData.company_email)}`, MARGIN, y); y += 4; }

  y += 3;
  drawLine(doc, y, PRIMARY);
  y += 7;

  // ── SECTION 2: Invoice meta ───────────────────────────────────────────────
  doc.setFont(FONT, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text('FACTURE', MARGIN, y);

  const sc = STATUS_CONFIG[invoiceData.statut] || STATUS_CONFIG.draft;
  drawRect(doc, MARGIN + 44, y - 6, 36, 8, sc.rgb);
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(sc.label, MARGIN + 62, y - 1, { align: 'center' });

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  y += 7;
  doc.text(`Numero : ${safe(invoiceData.numero) || '--'}`, MARGIN, y);
  y += 5;
  doc.text(`Date : ${formatDate(invoiceData.date_creation)}`, MARGIN, y);
  y += 5;
  doc.text(`Methode : ${BILLING_LABELS[invoiceData.billing_method] || safe(invoiceData.billing_method) || '--'}`, MARGIN, y);

  y += 7;
  drawLine(doc, y);
  y += 6;

  // ── SECTION 3: Client + QR ────────────────────────────────────────────────
  const clientStartY = y;
  const qrSize = 36;
  const qrX = RIGHT_EDGE - qrSize;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Facture a :', MARGIN, y);
  y += 5;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(safe(invoiceData.client_nom || clientData?.nom) || '--', MARGIN, y);
  y += 5;

  doc.setFont(FONT, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  [
    invoiceData.client_email  || clientData?.email,
    (invoiceData.client_tel || clientData?.tel) ? `Tel : ${invoiceData.client_tel || clientData?.tel}` : null,
    invoiceData.client_adresse || clientData?.adresse,
  ]
    .filter(Boolean)
    .forEach((line) => { doc.text(safe(line), MARGIN, y); y += 4; });

  doc.addImage(qrBase64, 'PNG', qrX, clientStartY, qrSize, qrSize);
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Scanner pour verifier', qrX + qrSize / 2, clientStartY + qrSize + 4, { align: 'center' });

  y = Math.max(y, clientStartY + qrSize + 8) + 4;
  drawLine(doc, y);
  y += 5;

  // ── SECTION 4: Line items table ───────────────────────────────────────────
  const tableBody = (invoiceData.lignes || []).map((l) => [
    safe(l.designation) || '--',
    String(l.quantite ?? 0),
    formatAmount(l.prix_unitaire, symbol),
    `${l.remise_ligne || 0}%`,
    `${l.tva_rate ?? 0}%`,
    formatAmount(l.total_ligne ?? (l.prix_unitaire * l.quantite), symbol),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: TABLE_W,
    head: [['Designation', 'Qte', 'Prix Unit.', 'Remise', 'TVA', 'Total']],
    body: tableBody,
    styles: {
      font: FONT,
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      overflow: 'linebreak',
      textColor: [40, 40, 40],
    },
    headStyles: {
      font: FONT,
      fontStyle: 'bold',
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: COL.desc,  halign: 'left'   },
      1: { cellWidth: COL.qty,   halign: 'center' },
      2: { cellWidth: COL.price, halign: 'right'  },
      3: { cellWidth: COL.disc,  halign: 'right'  },
      4: { cellWidth: COL.tva,   halign: 'center' },
      5: { cellWidth: COL.total, halign: 'right'  },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── SECTION 5: Totals ─────────────────────────────────────────────────────
  // Both tLabelX and RIGHT_EDGE are anchored to the same right margin as the table.
  const tLabelX = 124;

  if (y > FOOTER_TOP - 55) { doc.addPage(); y = 20; }

  const totRow = (label, value, bold = false, color = [50, 50, 50], fs = 9) => {
    doc.setFont(FONT, bold ? 'bold' : 'normal');
    doc.setFontSize(fs);
    doc.setTextColor(...color);
    doc.text(label, tLabelX, y);
    doc.text(formatAmount(value, symbol), RIGHT_EDGE, y, { align: 'right' });
    y += 6;
  };

  totRow('Total HT :', invoiceData.total_ht);

  if (Number(invoiceData.remise_globale_montant) > 0) {
    totRow(`Remise (${invoiceData.remise_globale || 0}%) :`, -Math.abs(invoiceData.remise_globale_montant), false, [180, 0, 0]);
    totRow('HT apres remise :', invoiceData.total_ht_after_remise);
  }

  if (invoiceData.tva_breakdown && Object.keys(invoiceData.tva_breakdown).length > 0) {
    Object.entries(invoiceData.tva_breakdown).forEach(([rate, amount]) => {
      totRow(`TVA (${rate}%) :`, amount);
    });
  } else {
    totRow('TVA :', invoiceData.tva_montant);
  }

  y += 2;
  drawLine(doc, y, PRIMARY);
  y += 5;
  totRow('Total TTC :', invoiceData.total_ttc, true, PRIMARY, 12);
  y += 6;

  // ── SECTION 6: Signature + Stamp ─────────────────────────────────────────
  if (y + 36 > FOOTER_TOP) { doc.addPage(); y = 20; }

  const sigY = y;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Signature de l'agent :", MARGIN, y);
  y += 4;

  if (signatureBase64) {
    doc.addImage(signatureBase64, 'PNG', MARGIN, y, 60, 24);
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.setLineDash([2, 2]);
    doc.rect(MARGIN, y, 60, 24);
    doc.setLineDash([]);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('(signature)', MARGIN + 30, y + 13, { align: 'center' });
  }

  // Stamp placeholder (right side)
  doc.setDrawColor(200, 200, 200);
  doc.setLineDash([3, 3]);
  doc.rect(120, sigY + 3, 50, 26);
  doc.setLineDash([]);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text('Cachet entreprise', 145, sigY + 17, { align: 'center' });
  doc.setDrawColor(0, 0, 0);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = PAGE_H - 14;
  drawLine(doc, footerY - 3, PRIMARY);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Page 1 / 1', PAGE_W / 2, footerY + 1, { align: 'center' });

  const legalParts = [
    companyData?.ice && `ICE : ${safe(companyData.ice)}`,
    companyData?.rc  && `RC : ${safe(companyData.rc)}`,
  ].filter(Boolean);
  if (legalParts.length) {
    doc.text(legalParts.join('   |   '), PAGE_W / 2, footerY + 5, { align: 'center' });
  }

  // Bottom accent bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, PAGE_H - 4, PAGE_W, 4, 'F');

  return doc;
}
