'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Check, X, Ban, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  setUserActiveAction,
  setUserRoleAction,
  rejectUserAction,
  deleteUserAction,
  setUserModulesAction,
  setUserEmploymentTypeAction,
} from '@/lib/actions/admin';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  rejectedAt: string | null;
  moduleWork: boolean;
  moduleFinance: boolean;
  employmentType: string;
  createdAt: string;
};

const ROLES = ['ADMIN', 'MANAGER', 'MEMBER'] as const;
type Role = (typeof ROLES)[number];
type Filter = 'all' | 'pending' | 'active' | 'rejected';

function userStatus(u: UserRow): 'ACTIVE' | 'PENDING' | 'REJECTED' {
  if (u.isActive) return 'ACTIVE';
  if (u.rejectedAt) return 'REJECTED';
  return 'PENDING';
}

const STATUS_BADGE_CLS: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE:   'bg-success/10 text-success',
  PENDING:  'bg-warning/10 text-warning',
  REJECTED: 'bg-destructive/10 text-destructive',
};

const ROW_BG_CLS: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE:   '',
  PENDING:  'bg-warning/5',
  REJECTED: 'bg-destructive/5',
};

const STATUS_LABEL: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE: 'Active', PENDING: 'Pending', REJECTED: 'Rejected',
};

function ActionButtons({
  user,
  status,
  isPending,
  size,
  onToggleActive,
  onReject,
  onDelete,
}: {
  user: UserRow;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  isPending: boolean;
  size: 'sm' | 'md';
  onToggleActive: (id: string, current: boolean) => void;
  onReject: (id: string) => void;
  onDelete: (id: string, name: string | null) => void;
}): React.JSX.Element {
  const btnSize: 'icon-sm' | 'icon-xs' = size === 'md' ? 'icon-sm' : 'icon-xs';

  return (
    <div className="flex gap-1.5 items-center">
      {status === 'PENDING' && (
        <>
          <Button size={btnSize} onClick={() => onToggleActive(user.id, false)} disabled={isPending} title="Approve" aria-label="Approve">
            <Check aria-hidden="true" />
          </Button>
          <Button size={btnSize} variant="outline" onClick={() => onReject(user.id)} disabled={isPending} title="Reject" aria-label="Reject">
            <X aria-hidden="true" />
          </Button>
        </>
      )}
      {status === 'ACTIVE' && (
        <Button size={btnSize} variant="outline" onClick={() => onToggleActive(user.id, true)} disabled={isPending} title="Deactivate" aria-label="Deactivate">
          <Ban aria-hidden="true" />
        </Button>
      )}
      {status === 'REJECTED' && (
        <Button size={btnSize} onClick={() => onToggleActive(user.id, false)} disabled={isPending} title="Approve" aria-label="Approve">
          <Check aria-hidden="true" />
        </Button>
      )}
      <Button size={btnSize} variant="destructive" onClick={() => onDelete(user.id, user.name)} disabled={isPending} title="Delete" aria-label="Delete">
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

export function UserTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pendingCount  = users.filter((u) => !u.isActive && !u.rejectedAt).length;
  const activeCount   = users.filter((u) => u.isActive).length;
  const rejectedCount = users.filter((u) => !!u.rejectedAt).length;

  const filtered = users.filter((u) => {
    const s = userStatus(u);
    if (filter === 'pending')  return s === 'PENDING';
    if (filter === 'active')   return s === 'ACTIVE';
    if (filter === 'rejected') return s === 'REJECTED';
    return true;
  });

  function handleError(userId: string, msg: string): void {
    setErrors((prev) => ({ ...prev, [userId]: msg }));
  }

  function clearError(userId: string): void {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  function toggleActive(userId: string, current: boolean): void {
    startTransition(async () => {
      const res = await setUserActiveAction(userId, !current);
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  function rejectUser(userId: string): void {
    startTransition(async () => {
      const res = await rejectUserAction(userId);
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  function deleteUser(userId: string, name: string | null): void {
    const label = name ?? 'this user';
    if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  function changeRole(userId: string, role: Role): void {
    startTransition(async () => {
      const res = await setUserRoleAction(userId, role);
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  function changeModules(userId: string, moduleWork: boolean, moduleFinance: boolean): void {
    startTransition(async () => {
      const res = await setUserModulesAction(userId, moduleWork, moduleFinance);
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  function changeEmploymentType(userId: string, employmentType: string): void {
    startTransition(async () => {
      const res = await setUserEmploymentTypeAction(userId, employmentType as 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH');
      if (res.success) { clearError(userId); router.refresh(); }
      else handleError(userId, res.error);
    });
  }

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all',      label: `All (${users.length})` },
    { id: 'pending',  label: `Pending (${pendingCount})` },
    { id: 'active',   label: `Active (${activeCount})` },
    { id: 'rejected', label: `Rejected (${rejectedCount})` },
  ];

  return (
    <div className={cn('transition-opacity duration-150', isPending && 'opacity-70')}>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              'py-1.5 px-4 rounded-full border text-[13px] font-medium cursor-pointer transition-colors',
              filter === id
                ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/70'
                : 'bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No users found.</p>
        )}
        {filtered.map((user) => {
          const isSelf = user.id === currentUserId;
          const status = userStatus(user);
          return (
            <div
              key={user.id}
              className={cn('rounded-xl border border-border bg-card p-4', ROW_BG_CLS[status])}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name ?? '—'}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_BADGE_CLS[status])}>
                  {STATUS_LABEL[status]}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <Select
                  value={user.role}
                  disabled={isSelf || isPending}
                  onValueChange={(v) => changeRole(user.id, v as Role)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={user.moduleWork}
                    disabled={isSelf || isPending}
                    onChange={(e) => changeModules(user.id, e.target.checked, user.moduleFinance)}
                    className="accent-primary"
                  />
                  Work
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={user.moduleFinance}
                    disabled={isSelf || isPending}
                    onChange={(e) => changeModules(user.id, user.moduleWork, e.target.checked)}
                    className="accent-primary"
                  />
                  Finance
                </label>
                <Select
                  value={user.employmentType}
                  disabled={isSelf || isPending}
                  onValueChange={(v) => changeEmploymentType(user.id, v)}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYED">Employee</SelectItem>
                    <SelectItem value="SOLE_TRADER">Sole Trader</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {errors[user.id] && (
                <p className="mt-2 text-xs text-destructive">{errors[user.id]}</p>
              )}

              {!isSelf && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <ActionButtons
                    user={user}
                    status={status}
                    size="sm"
                    isPending={isPending}
                    onToggleActive={toggleActive}
                    onReject={rejectUser}
                    onDelete={deleteUser}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="max-md:hidden overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">User</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Role</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Modules</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Employment</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            )}
            {filtered.map((user, i) => {
              const isSelf = user.id === currentUserId;
              const status = userStatus(user);
              return (
                <tr
                  key={user.id}
                  className={cn(
                    ROW_BG_CLS[status],
                    i < filtered.length - 1 && 'border-b border-border/60'
                  )}
                >
                  {/* User info */}
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-medium text-foreground">
                      {user.name ?? '—'}
                      {isSelf && <span className="ml-1.5 text-[0.7rem] text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {errors[user.id] && <div className="mt-1 text-xs text-destructive">{errors[user.id]}</div>}
                  </td>

                  {/* Role */}
                  <td className="px-3 py-2.5">
                    <Select
                      value={user.role}
                      disabled={isSelf || isPending}
                      onValueChange={(v) => changeRole(user.id, v as Role)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Modules */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <label className={cn('flex items-center gap-1 text-xs text-foreground', isSelf ? 'cursor-not-allowed' : 'cursor-pointer')}>
                        <input type="checkbox" checked={user.moduleWork} disabled={isSelf || isPending} onChange={(e) => changeModules(user.id, e.target.checked, user.moduleFinance)} className="accent-primary" />
                        Work
                      </label>
                      <label className={cn('flex items-center gap-1 text-xs text-foreground', isSelf ? 'cursor-not-allowed' : 'cursor-pointer')}>
                        <input type="checkbox" checked={user.moduleFinance} disabled={isSelf || isPending} onChange={(e) => changeModules(user.id, user.moduleWork, e.target.checked)} className="accent-primary" />
                        Finance
                      </label>
                    </div>
                  </td>

                  {/* Employment type */}
                  <td className="px-3 py-2.5">
                    <Select
                      value={user.employmentType}
                      disabled={isSelf || isPending}
                      onValueChange={(v) => changeEmploymentType(user.id, v)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYED">Employee</SelectItem>
                        <SelectItem value="SOLE_TRADER">Sole Trader</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Status badge */}
                  <td className="px-3 py-2.5">
                    <span className={cn('inline-block rounded-full px-2.5 py-1 text-xs font-medium', STATUS_BADGE_CLS[status])}>
                      {STATUS_LABEL[status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-right">
                    {!isSelf && (
                      <ActionButtons
                        user={user}
                        status={status}
                        size="md"
                        isPending={isPending}
                        onToggleActive={toggleActive}
                        onReject={rejectUser}
                        onDelete={deleteUser}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
