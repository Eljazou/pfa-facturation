import { useState } from 'react';
import { useSelector } from 'react-redux';
import { getSettings } from '../services/settingsService';
import { getInvoice } from '../services/firebaseService';
import { logger } from '../utils/logger';

export function usePDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { invoices } = useSelector((s) => s.invoices);

  const resolveInvoice = async (input) => {
    if (input && typeof input === 'object') return input;
    const fromStore = invoices.find((inv) => inv.id === input);
    if (fromStore) return fromStore;
    const fromDb = await getInvoice(input);
    if (!fromDb) throw new Error('Facture introuvable');
    return fromDb;
  };

  const buildPDF = async (input) => {
    setIsGenerating(true);
    try {
      const invoice = await resolveInvoice(input);

      const companyData = {};
      try {
        const settings = await getSettings();
        settings.forEach((s) => { companyData[s.key] = s.value; });
      } catch (e) {
        logger.warn('[usePDFGenerator] Settings unavailable, using empty company data:', e.message);
      }

      const { generatePDF } = await import('../utils/pdfGenerator');
      const doc = await generatePDF(
        invoice,
        null,
        companyData,
        invoice.signature_base64 || null
      );
      return { doc, invoice };
    } catch (err) {
      logger.error('[usePDFGenerator] PDF generation failed:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndDownload = async (input) => {
    const { doc, invoice } = await buildPDF(input);
    doc.save(`${invoice.numero || invoice.id}.pdf`);
  };

  const generateAndPreview = async (input) => {
    const { doc } = await buildPDF(input);
    window.open(doc.output('bloburl'), '_blank');
  };

  return { generateAndDownload, generateAndPreview, isGenerating };
}
