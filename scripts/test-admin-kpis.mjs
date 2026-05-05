// Standalone sanity check for computeAdminKPIs against the same source as the app.
// Run: node scripts/test-admin-kpis.mjs
import {
  computeAdminKPIs,
  buildMonthlyRevenueData,
  buildStatusDistributionData,
  buildTopClientsData,
  countOverdue,
} from '../src/services/dashboardService.js';

const today = '2026-05-05';

const invoices = [
  // Agent A — paid
  { id: 'i1', userId: 'A', client_id: 'C1', client_nom: 'ACME SARL',  statut: 'paid',
    total_ttc: 1620, devise: 'MAD', date_creation: '2026-01-12', date_depot: '2026-01-12',
    validated_at: '2026-01-13T09:00:00Z', date_encaissement: '2026-01-20T00:00:00Z' },
  { id: 'i2', userId: 'A', client_id: 'C1', client_nom: 'ACME SARL',  statut: 'paid',
    total_ttc: 4800, devise: 'MAD', date_creation: '2026-02-04', date_encaissement: '2026-02-15T00:00:00Z' },
  { id: 'i3', userId: 'A', client_id: 'C2', client_nom: 'Globex Co.', statut: 'paid',
    total_ttc: 12000, devise: 'MAD', date_creation: '2026-03-08', date_encaissement: '2026-03-25T00:00:00Z' },

  // Agent A — validated, not yet paid
  { id: 'i4', userId: 'A', client_id: 'C3', client_nom: 'Initech',    statut: 'validated',
    total_ttc: 7500, devise: 'MAD', date_creation: '2026-04-20', date_depot: '2026-04-20', validated_at: '2026-04-22T10:00:00Z' },

  // Agent B — pending (overdue: submitted 2026-03-01, today 2026-05-05 → 65 days, overdue by 35)
  { id: 'i5', userId: 'B', client_id: 'C4', client_nom: 'Wayne Ent.', statut: 'pending',
    total_ttc: 3200, devise: 'MAD', date_creation: '2026-03-01', date_depot: '2026-03-01' },

  // Agent B — pending (recent, not overdue)
  { id: 'i6', userId: 'B', client_id: 'C2', client_nom: 'Globex Co.', statut: 'pending',
    total_ttc: 2100, devise: 'MAD', date_creation: '2026-04-28', date_depot: '2026-04-28' },

  // Agent B — rejected
  { id: 'i7', userId: 'B', client_id: 'C5', client_nom: 'Stark Ind.', statut: 'rejected',
    total_ttc: 950,  devise: 'MAD', date_creation: '2026-04-10', rejection_reason: 'TVA incorrecte', rejected_at: '2026-04-12T14:00:00Z' },

  // Agent C — draft (not submitted)
  { id: 'i8', userId: 'C', client_id: 'C6', client_nom: 'Hooli',      statut: 'draft',
    total_ttc: 1500, devise: 'MAD', date_creation: '2026-05-01' },
];

const kpis      = computeAdminKPIs(invoices);
const monthly   = buildMonthlyRevenueData(invoices, 2026);
const status    = buildStatusDistributionData(invoices);
const topCli    = buildTopClientsData(invoices, [], 5);
const overdue   = countOverdue(invoices, today);

console.log('=== computeAdminKPIs ===');
console.log(JSON.stringify(kpis, null, 2));
console.log('\n=== buildMonthlyRevenueData(2026) ===');
console.log(monthly.filter((m) => m.revenue > 0));
console.log('\n=== buildStatusDistributionData ===');
console.log(status);
console.log('\n=== buildTopClientsData ===');
console.log(topCli);
console.log('\n=== countOverdue (today=2026-05-05) ===');
console.log(overdue);
