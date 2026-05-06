import { describe, it, expect } from 'vitest';
import { canTransition, getAvailableActions, TRANSITIONS } from './workflowService';

describe('canTransition', () => {
  it('user can submit draft → pending', () => {
    expect(canTransition('draft', 'pending', 'user')).toBe(true);
  });
  it('user CANNOT validate pending', () => {
    expect(canTransition('pending', 'validated', 'user')).toBe(false);
  });
  it('admin can validate pending', () => {
    expect(canTransition('pending', 'validated', 'admin')).toBe(true);
  });
  it('admin can reject pending', () => {
    expect(canTransition('pending', 'rejected', 'admin')).toBe(true);
  });
  it('user can resubmit rejected → pending', () => {
    expect(canTransition('rejected', 'pending', 'user')).toBe(true);
  });
  it('user can mark validated → paid', () => {
    expect(canTransition('validated', 'paid', 'user')).toBe(true);
  });
  it('admin CANNOT mark validated → paid (user-only)', () => {
    expect(canTransition('validated', 'paid', 'admin')).toBe(false);
  });
  it('nobody can transition from paid', () => {
    expect(canTransition('paid', 'validated', 'user')).toBe(false);
    expect(canTransition('paid', 'pending', 'user')).toBe(false);
    expect(canTransition('paid', 'paid', 'admin')).toBe(false);
  });
  it('rejects unknown source status', () => {
    expect(canTransition('mystery', 'pending', 'user')).toBe(false);
  });
  it('rejects skipping states (draft → validated)', () => {
    expect(canTransition('draft', 'validated', 'user')).toBe(false);
    expect(canTransition('draft', 'validated', 'admin')).toBe(false);
  });
  it('TRANSITIONS terminal states have no next', () => {
    expect(TRANSITIONS.paid.next).toEqual([]);
  });
});

describe('getAvailableActions', () => {
  it('user on draft', () => {
    expect(getAvailableActions('draft', 'user')).toEqual(['submit', 'edit', 'delete']);
  });
  it('user on rejected', () => {
    expect(getAvailableActions('rejected', 'user')).toEqual(['revise', 'resubmit']);
  });
  it('admin on pending', () => {
    expect(getAvailableActions('pending', 'admin')).toEqual(['validate', 'reject']);
  });
  it('user on validated', () => {
    expect(getAvailableActions('validated', 'user')).toEqual(['download', 'mark_paid']);
  });
  it('admin on draft has no actions', () => {
    expect(getAvailableActions('draft', 'admin')).toEqual([]);
  });
  it('user on pending has no actions (waiting for admin)', () => {
    expect(getAvailableActions('pending', 'user')).toEqual([]);
  });
  it('returns empty for unknown role/status', () => {
    expect(getAvailableActions('draft', 'guest')).toEqual([]);
    expect(getAvailableActions('mystery', 'user')).toEqual([]);
  });
});
