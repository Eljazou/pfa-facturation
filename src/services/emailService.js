import emailjs from '@emailjs/browser';
import { logger } from '../utils/logger';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

const fmtAmount = (n, devise = 'MAD') => {
  const num = Number(n ?? 0).toFixed(2);
  const [int, dec] = num.split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec} ${devise}`;
};

export async function sendInvoiceEmail(invoiceData, clientData, companySettings, agentName = '') {
  if (!isConfigured) {
    return {
      success: false,
      error: 'EmailJS non configuré (variables VITE_EMAILJS_* manquantes dans .env)',
    };
  }

  const to_email = invoiceData.client_email || clientData?.email;
  const to_name  = invoiceData.client_nom   || clientData?.nom;
  if (!to_email) return { success: false, error: 'Email client manquant' };

  const params = {
    to_email,
    to_name,
    company_name:   companySettings?.company_name  || '',
    invoice_number: invoiceData.numero || '',
    invoice_date:   fmtDate(invoiceData.date_creation),
    total_ttc:      fmtAmount(invoiceData.total_ttc, invoiceData.devise || 'MAD'),
    devise:         invoiceData.devise || 'MAD',
    invoice_url:    `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '')}/p/invoice/${invoiceData.id}`,
    agent_name:     agentName || '',
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    return { success: true };
  } catch (err) {
    logger.warn('[emailService] EmailJS send failed:', err);
    return { success: false, error: err?.text || err?.message || 'EmailJS error' };
  }
}
