/**
 * Tests for feedback-module.ts — normaliseModuleFromPath
 * Coverage gate: 100% (pure function)
 */

import { normaliseModuleFromPath } from './feedback-module';

describe('normaliseModuleFromPath', () => {
  // ─── Finance paths ───────────────────────────────────────────────────────────

  it('should return "Finance" for /finance', () => {
    expect(normaliseModuleFromPath('/finance')).toBe('Finance');
  });

  it('should return "Finance" for /finance/invoices', () => {
    expect(normaliseModuleFromPath('/finance/invoices')).toBe('Finance');
  });

  it('should return "Finance" for /finance/accounts/123', () => {
    expect(normaliseModuleFromPath('/finance/accounts/123')).toBe('Finance');
  });

  // ─── Work paths ──────────────────────────────────────────────────────────────

  it('should return "Work" for /tasks', () => {
    expect(normaliseModuleFromPath('/tasks')).toBe('Work');
  });

  it('should return "Work" for /tasks/new', () => {
    expect(normaliseModuleFromPath('/tasks/new')).toBe('Work');
  });

  it('should return "Work" for /dashboard', () => {
    expect(normaliseModuleFromPath('/dashboard')).toBe('Work');
  });

  it('should return "Work" for /work-logs', () => {
    expect(normaliseModuleFromPath('/work-logs')).toBe('Work');
  });

  it('should return "Work" for /work-logs/123', () => {
    expect(normaliseModuleFromPath('/work-logs/123')).toBe('Work');
  });

  it('should return "Work" for /achievements', () => {
    expect(normaliseModuleFromPath('/achievements')).toBe('Work');
  });

  it('should return "Work" for /achievements/new', () => {
    expect(normaliseModuleFromPath('/achievements/new')).toBe('Work');
  });

  it('should return "Work" for /notes', () => {
    expect(normaliseModuleFromPath('/notes')).toBe('Work');
  });

  it('should return "Work" for /notes/abc-123', () => {
    expect(normaliseModuleFromPath('/notes/abc-123')).toBe('Work');
  });

  it('should return "Work" for /todo', () => {
    expect(normaliseModuleFromPath('/todo')).toBe('Work');
  });

  it('should return "Work" for /todo/2026-03-22', () => {
    expect(normaliseModuleFromPath('/todo/2026-03-22')).toBe('Work');
  });

  // ─── Admin paths ─────────────────────────────────────────────────────────────

  it('should return "Admin" for /admin', () => {
    expect(normaliseModuleFromPath('/admin')).toBe('Admin');
  });

  it('should return "Admin" for /admin/users', () => {
    expect(normaliseModuleFromPath('/admin/users')).toBe('Admin');
  });

  it('should return "Admin" for /admin/feedback', () => {
    expect(normaliseModuleFromPath('/admin/feedback')).toBe('Admin');
  });

  // ─── General / fallback paths ────────────────────────────────────────────────

  it('should return "General" for /profile', () => {
    expect(normaliseModuleFromPath('/profile')).toBe('General');
  });

  it('should return "General" for /settings', () => {
    expect(normaliseModuleFromPath('/settings')).toBe('General');
  });

  it('should return "General" for an unknown path', () => {
    expect(normaliseModuleFromPath('/unknown-route')).toBe('General');
  });

  it('should return "General" for /feedback (user history page — not a module prefix)', () => {
    expect(normaliseModuleFromPath('/feedback')).toBe('General');
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  it('should return "General" for the root path /', () => {
    expect(normaliseModuleFromPath('/')).toBe('General');
  });

  it('should return "General" for an empty string', () => {
    expect(normaliseModuleFromPath('')).toBe('General');
  });
});
