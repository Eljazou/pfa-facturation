import { updateStatus } from './firebaseService';

export const TRANSITIONS = {
  draft:     { next: ['pending'],               actor: 'user'  },
  pending:   { next: ['validated', 'rejected'], actor: 'admin' },
  validated: { next: ['paid'],                  actor: 'user'  },
  rejected:  { next: ['pending'],               actor: 'user'  },
  paid:      { next: [],                        actor: 'user'  },
};

const ACTIONS = {
  user: {
    draft:     ['submit', 'edit', 'delete'],
    rejected:  ['revise', 'resubmit'],
    validated: ['download', 'mark_paid'],
    paid:      ['download'],
    pending:   [],
  },
  admin: {
    pending:   ['validate', 'reject'],
    draft:     [],
    rejected:  [],
    validated: ['download'],
    paid:      ['download'],
  },
};

export function canTransition(currentStatus, targetStatus, userRole) {
  const rule = TRANSITIONS[currentStatus];
  if (!rule) return false;
  if (!rule.next.includes(targetStatus)) return false;
  return rule.actor === userRole;
}

export function getAvailableActions(currentStatus, userRole) {
  return ACTIONS[userRole]?.[currentStatus] ?? [];
}

const now = () => new Date().toISOString();

function buildPayload(currentStatus, targetStatus, userId, extra = {}) {
  switch (targetStatus) {
    case 'pending':
      return { statut: 'pending', date_depot: now() };
    case 'validated':
      return { statut: 'validated', validated_by: userId, validated_at: now() };
    case 'rejected':
      return { statut: 'rejected', rejection_reason: extra.reason, rejected_by: userId, rejected_at: now() };
    case 'paid':
      return {
        statut: 'paid',
        date_encaissement: extra.date || now(),
        type_virement: extra.type || 'Virement bancaire',
        ...(extra.reference ? { reference_paiement: extra.reference } : {}),
      };
    default:
      throw new Error(`Unknown target status: ${targetStatus}`);
  }
}

export async function transitionInvoice(invoiceId, currentStatus, targetStatus, userRole, userId, extra = {}) {
  if (!canTransition(currentStatus, targetStatus, userRole)) {
    return { success: false, error: `Transition ${currentStatus} → ${targetStatus} non autorisée pour le rôle ${userRole}` };
  }
  try {
    const payload = buildPayload(currentStatus, targetStatus, userId, extra);
    await updateStatus(invoiceId, payload);
    return { success: true, payload };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
