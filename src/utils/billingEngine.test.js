import { describe, it, expect } from 'vitest';
import { calculateLine, calculateInvoice } from './billingEngine';

// ── calculateLine ─────────────────────────────────────────────────────────────

describe('calculateLine — simple', () => {
  it('applies 20% TVA on prix × qte', () => {
    const r = calculateLine(
      { prix_unitaire: 100, quantite: 2, remise_ligne: 0, categorie_id: 1 },
      'simple', {}
    );
    expect(r.sous_total_brut).toBe(200);
    expect(r.remise_montant).toBe(0);
    expect(r.sous_total_net).toBe(200);
    expect(r.tva_rate).toBe(20);
    expect(r.tva_montant).toBe(40);
    expect(r.total_ligne).toBe(240);
  });

  it('handles single item at higher price', () => {
    const r = calculateLine(
      { prix_unitaire: 1500, quantite: 1, remise_ligne: 0, categorie_id: 1 },
      'simple', {}
    );
    expect(r.total_ligne).toBe(1800);
  });
});

describe('calculateLine — line_discount', () => {
  it('deducts remise % before applying 20% TVA', () => {
    const r = calculateLine(
      { prix_unitaire: 100, quantite: 2, remise_ligne: 10, categorie_id: 1 },
      'line_discount', {}
    );
    expect(r.sous_total_brut).toBe(200);
    expect(r.remise_montant).toBe(20);
    expect(r.sous_total_net).toBe(180);
    expect(r.tva_montant).toBe(36);
    expect(r.total_ligne).toBe(216);
  });

  it('0% discount is identical to simple', () => {
    const r = calculateLine(
      { prix_unitaire: 500, quantite: 1, remise_ligne: 0, categorie_id: 1 },
      'line_discount', {}
    );
    expect(r.remise_montant).toBe(0);
    expect(r.total_ligne).toBe(600);
  });
});

describe('calculateLine — global_discount', () => {
  it('returns 0 TVA at line level (TVA applied globally)', () => {
    const r = calculateLine(
      { prix_unitaire: 100, quantite: 2, remise_ligne: 0, categorie_id: 1 },
      'global_discount', {}
    );
    expect(r.sous_total_net).toBe(200);
    expect(r.tva_rate).toBe(0);
    expect(r.tva_montant).toBe(0);
    expect(r.total_ligne).toBe(200);
  });

  it('ignores remise_ligne even if set', () => {
    const r = calculateLine(
      { prix_unitaire: 100, quantite: 2, remise_ligne: 50, categorie_id: 1 },
      'global_discount', {}
    );
    expect(r.remise_montant).toBe(0);
    expect(r.sous_total_net).toBe(200);
  });
});

describe('calculateLine — category_tva', () => {
  it('uses TVA rate from category map', () => {
    const r = calculateLine(
      { prix_unitaire: 100, quantite: 1, remise_ligne: 0, categorie_id: 2 },
      'category_tva', { 2: 10 }
    );
    expect(r.tva_rate).toBe(10);
    expect(r.tva_montant).toBe(10);
    expect(r.total_ligne).toBe(110);
  });

  it('handles 0% TVA category (formation)', () => {
    const r = calculateLine(
      { prix_unitaire: 1500, quantite: 1, remise_ligne: 0, categorie_id: 3 },
      'category_tva', { 3: 0 }
    );
    expect(r.tva_rate).toBe(0);
    expect(r.tva_montant).toBe(0);
    expect(r.total_ligne).toBe(1500);
  });
});

// ── calculateInvoice ──────────────────────────────────────────────────────────

const BASE_LINES = [
  { prix_unitaire: 1000, quantite: 2, remise_ligne: 0, categorie_id: 1 }, // HT=2000
  { prix_unitaire: 500, quantite: 1, remise_ligne: 0, categorie_id: 2 },  // HT=500
]; // total HT = 2500

describe('calculateInvoice — simple', () => {
  it('applies flat 20% TVA on total HT', () => {
    const r = calculateInvoice(BASE_LINES, 'simple', 0, {});
    expect(r.total_ht).toBe(2500);
    expect(r.remise_globale_montant).toBe(0);
    expect(r.tva_montant).toBe(500);
    expect(r.total_ttc).toBe(3000);
  });

  it('returns all zeros for empty lines', () => {
    const r = calculateInvoice([], 'simple', 0, {});
    expect(r.total_ht).toBe(0);
    expect(r.tva_montant).toBe(0);
    expect(r.total_ttc).toBe(0);
  });
});

describe('calculateInvoice — line_discount', () => {
  it('sums per-line discounted amounts correctly', () => {
    const lines = [
      { prix_unitaire: 1000, quantite: 2, remise_ligne: 10, categorie_id: 1 }, // net=1800
      { prix_unitaire: 500, quantite: 1, remise_ligne: 20, categorie_id: 2 },  // net=400
    ];
    const r = calculateInvoice(lines, 'line_discount', 0, {});
    expect(r.total_ht).toBe(2200);
    expect(r.tva_montant).toBe(440);
    expect(r.total_ttc).toBe(2640);
  });

  it('0% discount on all lines equals simple', () => {
    const r = calculateInvoice(BASE_LINES, 'line_discount', 0, {});
    expect(r.total_ttc).toBe(3000);
  });
});

describe('calculateInvoice — global_discount', () => {
  it('applies discount on HT then 20% TVA on discounted amount', () => {
    const r = calculateInvoice(BASE_LINES, 'global_discount', 10, {});
    expect(r.total_ht).toBe(2500);
    expect(r.remise_globale_montant).toBe(250);
    expect(r.total_ht_after_remise).toBe(2250);
    expect(r.tva_montant).toBe(450);
    expect(r.total_ttc).toBe(2700);
  });

  it('0% global discount: total_ttc = total_ht × 1.20', () => {
    const r = calculateInvoice(BASE_LINES, 'global_discount', 0, {});
    expect(r.remise_globale_montant).toBe(0);
    expect(r.total_ht_after_remise).toBe(2500);
    expect(r.total_ttc).toBe(3000);
  });
});

describe('calculateInvoice — category_tva', () => {
  it('uses per-category TVA rates and provides tva_breakdown', () => {
    const r = calculateInvoice(BASE_LINES, 'category_tva', 0, { 1: 20, 2: 10 });
    expect(r.total_ht).toBe(2500);
    expect(r.tva_breakdown['20']).toBe(400); // 2000 × 20%
    expect(r.tva_breakdown['10']).toBe(50);  // 500 × 10%
    expect(r.tva_montant).toBe(450);
    expect(r.total_ttc).toBe(2950);
  });

  it('all 0% TVA: total_ttc equals total_ht', () => {
    const r = calculateInvoice(BASE_LINES, 'category_tva', 0, { 1: 0, 2: 0 });
    expect(r.tva_montant).toBe(0);
    expect(r.total_ttc).toBe(2500);
  });
});
