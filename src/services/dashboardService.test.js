import { describe, it, expect } from 'vitest';
import {
  computeUserKPIs, computeAdminKPIs,
  buildMonthlyRevenueData, buildStatusDistributionData, buildMonthlyTrendData,
  buildTopClientsData, filterInvoices, computeOverdueStatus, countOverdue,
} from './dashboardService';

const TODAY = '2026-05-05';

const SAMPLE = [
  { id: '1', userId: 'A', client_id: 'C1', client_nom: 'ACME',  statut: 'paid',
    total_ttc: 1000, devise: 'MAD', date_creation: '2026-01-12',
    date_encaissement: '2026-01-20T00:00:00Z' },
  { id: '2', userId: 'A', client_id: 'C1', client_nom: 'ACME',  statut: 'paid',
    total_ttc: 2000, devise: 'MAD', date_creation: '2026-02-04',
    date_encaissement: '2026-02-15T00:00:00Z' },
  { id: '3', userId: 'A', client_id: 'C2', client_nom: 'Globex', statut: 'paid',
    total_ttc: 5000, devise: 'MAD', date_creation: '2026-03-08',
    date_encaissement: '2026-03-25T00:00:00Z' },
  { id: '4', userId: 'A', client_id: 'C3', client_nom: 'Initech', statut: 'validated',
    total_ttc: 3000, devise: 'MAD', date_creation: '2026-04-20',
    date_depot: '2026-04-20', validated_at: '2026-04-22T10:00:00Z' },
  { id: '5', userId: 'B', client_id: 'C4', client_nom: 'Wayne', statut: 'pending',
    total_ttc: 800, devise: 'MAD', date_creation: '2026-03-01', date_depot: '2026-03-01' },
  { id: '6', userId: 'B', client_id: 'C5', client_nom: 'Stark', statut: 'rejected',
    total_ttc: 500, devise: 'MAD', date_creation: '2026-04-10' },
  { id: '7', userId: 'C', client_id: 'C6', client_nom: 'Hooli', statut: 'draft',
    total_ttc: 200, devise: 'MAD', date_creation: '2026-05-01' },
];

describe('computeUserKPIs', () => {
  it('filters by userId', () => {
    const r = computeUserKPIs(SAMPLE, 'A');
    expect(r.total_factures).toBe(4);
    expect(r.total_payees).toBe(3);
    expect(r.total_validees).toBe(1);
  });
  it('returns zeros when user has no invoices', () => {
    const r = computeUserKPIs(SAMPLE, 'Z');
    expect(r.total_factures).toBe(0);
    expect(r.montant_total_ttc).toBe(0);
    expect(r.moyenne_facture).toBe(0);
  });
  it('montant_encaisse covers paid only', () => {
    const r = computeUserKPIs(SAMPLE, 'A');
    expect(r.montant_encaisse).toBe(8000); // 1000+2000+5000
  });
});

describe('computeAdminKPIs', () => {
  it('counts all invoices', () => {
    expect(computeAdminKPIs(SAMPLE).total_factures).toBe(7);
  });
  it('montant_encaisse totals only paid', () => {
    expect(computeAdminKPIs(SAMPLE).montant_encaisse).toBe(8000);
  });
  it('counts unique active clients', () => {
    expect(computeAdminKPIs(SAMPLE).total_clients_actifs).toBe(6);
  });
  it('counts unique agents', () => {
    expect(computeAdminKPIs(SAMPLE).total_agents).toBe(3);
  });
  it('taux_validation = validated / total', () => {
    const r = computeAdminKPIs(SAMPLE);
    expect(r.taux_validation).toBeCloseTo((1 / 7) * 100, 4);
  });
  it('taux_rejet = rejected / total', () => {
    const r = computeAdminKPIs(SAMPLE);
    expect(r.taux_rejet).toBeCloseTo((1 / 7) * 100, 4);
  });
  it('top_client is highest paid total', () => {
    const r = computeAdminKPIs(SAMPLE);
    expect(r.top_client.client_id).toBe('C2');
    expect(r.top_client.total_ttc).toBe(5000);
  });
});

describe('buildMonthlyRevenueData', () => {
  it('returns 12 months always', () => {
    expect(buildMonthlyRevenueData(SAMPLE, 2026)).toHaveLength(12);
  });
  it('groups paid invoices by month', () => {
    const r = buildMonthlyRevenueData(SAMPLE, 2026);
    expect(r[0].revenue).toBe(1000); // Jan
    expect(r[1].revenue).toBe(2000); // Fév
    expect(r[2].revenue).toBe(5000); // Mar
    expect(r[3].revenue).toBe(0);    // Avr (no paid)
  });
  it('fills missing months with 0', () => {
    const r = buildMonthlyRevenueData([], 2026);
    expect(r.every((m) => m.revenue === 0 && m.count === 0)).toBe(true);
  });
  it('respects year filter', () => {
    const out = buildMonthlyRevenueData(SAMPLE, 2025);
    expect(out.every((m) => m.revenue === 0)).toBe(true);
  });
});

describe('buildStatusDistributionData', () => {
  it('returns counts per status', () => {
    const r = buildStatusDistributionData(SAMPLE);
    const byKey = Object.fromEntries(r.map((x) => [x.key, x.value]));
    expect(byKey.paid).toBe(3);
    expect(byKey.validated).toBe(1);
    expect(byKey.pending).toBe(1);
    expect(byKey.rejected).toBe(1);
    expect(byKey.draft).toBe(1);
  });
  it('omits zero-count statuses', () => {
    const r = buildStatusDistributionData([{ statut: 'paid', total_ttc: 100 }]);
    expect(r.length).toBe(1);
    expect(r[0].key).toBe('paid');
  });
  it('returns empty for empty input', () => {
    expect(buildStatusDistributionData([])).toEqual([]);
  });
});

describe('buildMonthlyTrendData', () => {
  it('returns N buckets', () => {
    expect(buildMonthlyTrendData(SAMPLE, 6)).toHaveLength(6);
  });
});

describe('buildTopClientsData', () => {
  it('ranks by total descending', () => {
    const r = buildTopClientsData(SAMPLE, [], 5);
    expect(r[0].id).toBe('C2'); // 5000
    expect(r[1].id).toBe('C1'); // 3000 (1000+2000)
    expect(r[0].count).toBe(1);
    expect(r[1].count).toBe(2);
  });
  it('respects limit', () => {
    expect(buildTopClientsData(SAMPLE, [], 1)).toHaveLength(1);
  });
  it('returns empty if no paid invoices', () => {
    const noPaid = SAMPLE.filter((i) => i.statut !== 'paid');
    expect(buildTopClientsData(noPaid, [], 5)).toEqual([]);
  });
});

describe('filterInvoices', () => {
  it('filters by date range', () => {
    const r = filterInvoices(SAMPLE, { dateFrom: '2026-03-01', dateTo: '2026-03-31' });
    expect(r.map((x) => x.id)).toEqual(['3', '5']);
  });
  it('filters by agent', () => {
    expect(filterInvoices(SAMPLE, { agentId: 'B' }).map((x) => x.id)).toEqual(['5', '6']);
  });
  it('filters by devise', () => {
    expect(filterInvoices(SAMPLE, { devise: 'EUR' })).toHaveLength(0);
  });
  it('returns all when no filters', () => {
    expect(filterInvoices(SAMPLE, {})).toHaveLength(7);
  });
});

describe('computeOverdueStatus', () => {
  it('flags pending over 30 days as overdue', () => {
    // i5: deposited 2026-03-01, today 2026-05-05 → 65 days, overdue by 35
    const r = computeOverdueStatus(SAMPLE.find((i) => i.id === '5'), TODAY);
    expect(r.isOverdue).toBe(true);
    expect(r.daysOverdue).toBe(35);
  });
  it('does not flag recent pending', () => {
    expect(computeOverdueStatus(
      { statut: 'pending', date_depot: '2026-04-28' }, TODAY
    ).isOverdue).toBe(false);
  });
  it('never flags paid invoices', () => {
    expect(computeOverdueStatus(SAMPLE.find((i) => i.id === '1'), TODAY).isOverdue).toBe(false);
  });
  it('never flags draft / rejected', () => {
    expect(computeOverdueStatus({ statut: 'draft', date_creation: '2025-01-01' }, TODAY).isOverdue).toBe(false);
    expect(computeOverdueStatus({ statut: 'rejected', date_creation: '2025-01-01' }, TODAY).isOverdue).toBe(false);
  });
  it('handles missing reference date', () => {
    expect(computeOverdueStatus({ statut: 'pending' }, TODAY).isOverdue).toBe(false);
  });
});

describe('countOverdue', () => {
  it('counts only overdue invoices', () => {
    expect(countOverdue(SAMPLE, TODAY)).toBe(1);
  });
});
