/**
 * Pure function — generates the next invoice number for the current year.
 * Format: FAC-YYYY-XXXX (e.g. FAC-2026-0042)
 */
export function generateInvoiceNumber(existingInvoices = []) {
  const year = new Date().getFullYear();
  const yearStr = String(year);

  const count = existingInvoices.filter((inv) => {
    if (!inv.numero) return false;
    const parts = inv.numero.split('-');
    return parts.length === 3 && parts[0] === 'FAC' && parts[1] === yearStr;
  }).length;

  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
}
