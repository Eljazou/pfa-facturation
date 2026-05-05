import Decimal from 'decimal.js';

const DEFAULT_TVA = 20;

/**
 * Calculate a single invoice line.
 * For 'global_discount': TVA is NOT applied at line level (applied globally in calculateInvoice).
 */
export function calculateLine(ligne, method, categoryTVARates = {}) {
  const prix = new Decimal(ligne.prix_unitaire ?? 0);
  const qte = new Decimal(ligne.quantite ?? 0);
  const remisePct = new Decimal(ligne.remise_ligne ?? 0);

  const sous_total_brut = prix.times(qte);

  let remise_montant = new Decimal(0);
  let sous_total_net = sous_total_brut;

  if (method === 'line_discount') {
    remise_montant = sous_total_brut.times(remisePct).dividedBy(100);
    sous_total_net = sous_total_brut.minus(remise_montant);
  }

  let tva_rate = new Decimal(0);
  let tva_montant = new Decimal(0);

  if (method !== 'global_discount') {
    tva_rate =
      method === 'category_tva'
        ? new Decimal(categoryTVARates[ligne.categorie_id] ?? 0)
        : new Decimal(DEFAULT_TVA);
    tva_montant = sous_total_net.times(tva_rate).dividedBy(100);
  }

  const total_ligne = sous_total_net.plus(tva_montant);

  return {
    sous_total_brut: +sous_total_brut.toDecimalPlaces(2),
    remise_montant: +remise_montant.toDecimalPlaces(2),
    sous_total_net: +sous_total_net.toDecimalPlaces(2),
    tva_rate: +tva_rate,
    tva_montant: +tva_montant.toDecimalPlaces(2),
    total_ligne: +total_ligne.toDecimalPlaces(2),
  };
}

/**
 * Calculate full invoice totals from all lines.
 * method: 'simple' | 'line_discount' | 'global_discount' | 'category_tva'
 */
export function calculateInvoice(lignes, method, remise_globale = 0, categoryTVARates = {}) {
  if (!lignes || lignes.length === 0) {
    return {
      total_ht: 0,
      remise_globale_montant: 0,
      total_ht_after_remise: 0,
      tva_montant: 0,
      tva_breakdown: {},
      total_ttc: 0,
    };
  }

  const lines = lignes.map((l) => calculateLine(l, method, categoryTVARates));

  const total_ht = lines.reduce(
    (acc, l) => acc.plus(new Decimal(l.sous_total_net)),
    new Decimal(0)
  );

  let remise_globale_montant = new Decimal(0);
  let total_ht_after_remise = total_ht;

  if (method === 'global_discount') {
    remise_globale_montant = total_ht.times(new Decimal(remise_globale)).dividedBy(100);
    total_ht_after_remise = total_ht.minus(remise_globale_montant);
  }

  let tva_montant;
  let tva_breakdown = {};

  if (method === 'global_discount') {
    const tva = total_ht_after_remise.times(DEFAULT_TVA).dividedBy(100);
    tva_montant = tva;
    tva_breakdown = { [DEFAULT_TVA]: +tva.toDecimalPlaces(2) };
  } else if (method === 'category_tva') {
    const grouped = {};
    lines.forEach((l) => {
      const r = String(l.tva_rate);
      grouped[r] = (grouped[r] || new Decimal(0)).plus(new Decimal(l.tva_montant));
    });
    tva_montant = Object.values(grouped).reduce((a, v) => a.plus(v), new Decimal(0));
    tva_breakdown = Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, +v.toDecimalPlaces(2)])
    );
  } else {
    const tva = lines.reduce(
      (acc, l) => acc.plus(new Decimal(l.tva_montant)),
      new Decimal(0)
    );
    tva_montant = tva;
    tva_breakdown = { [DEFAULT_TVA]: +tva.toDecimalPlaces(2) };
  }

  const total_ttc = total_ht_after_remise.plus(tva_montant);

  return {
    total_ht: +total_ht.toDecimalPlaces(2),
    remise_globale_montant: +remise_globale_montant.toDecimalPlaces(2),
    total_ht_after_remise: +total_ht_after_remise.toDecimalPlaces(2),
    tva_montant: +tva_montant.toDecimalPlaces(2),
    tva_breakdown,
    total_ttc: +total_ttc.toDecimalPlaces(2),
  };
}
