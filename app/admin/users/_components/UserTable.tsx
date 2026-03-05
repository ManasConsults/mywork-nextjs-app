'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Check, X, Ban, Trash2 } from 'lucide-react';

import { setUserActiveAction, setUserRoleAction, rejectUserAction, deleteUserAction } from '@/lib/actions/admin';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  rejectedAt: string | null;
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

// Desktop table styles (original inline styles)
const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const STATUS_BADGE: Record<'ACTIVE' | 'PENDING' | 'REJECTED', React.CSSProperties> = {
  ACTIVE:   { backgroundColor: '#dcfce7', color: '#166534' },
  PENDING:  { backgroundColor: '#fef9c3', color: '#854d0e' },
  REJECTED: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const ROW_BG: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE:   'transparent',
  PENDING:  '#fffbeb',
  REJECTED: '#fff1f2',
};

// Mobile card styles (Tailwind classes)
const CARD_STATUS_BADGE: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE:   'bg-green-100 text-green-800',
  PENDING:  'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const CARD_ROW_BG: Record<'ACTIVE' | 'PENDING' | 'REJECTED', string> = {
  ACTIVE:   '',
  PENDING:  'bg-yellow-50',
  REJECTED: 'bg-red-50',
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
  const btn = size === 'md'
    ? 'w-10 h-10 flex items-center justify-center rounded-md border-2 cursor-pointer disabled:cursor-not-allowed transition-colors'
    : 'w-9 h-9 flex items-center justify-center rounded-md border-2 cursor-pointer disabled:cursor-not-allowed transition-colors';
  const iconSize = size === 'md' ? 18 : 16;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {status === 'PENDING' && (
        <>
          <button
            onClick={() => onToggleActive(user.id, false)}
            disabled={isPending}
            title="Approve"
            className={`${btn} border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:border-teal-700`}
          >
            <Check size={iconSize} aria-hidden="true" />
          </button>
          <button
            onClick={() => onReject(user.id)}
            disabled={isPending}
            title="Reject"
            className={`${btn} border-red-300 bg-white text-red-600 hover:bg-red-50`}
          >
            <X size={iconSize} aria-hidden="true" />
          </button>
        </>
      )}
      {status === 'ACTIVE' && (
        <button
          onClick={() => onToggleActive(user.id, true)}
          disabled={isPending}
          title="Deactivate"
          className={`${btn} border-red-300 bg-white text-red-600 hover:bg-red-50`}
        >
          <Ban size={iconSize} aria-hidden="true" />
        </button>
      )}
      {status === 'REJECTED' && (
        <button
          onClick={() => onToggleActive(user.id, false)}
          disabled={isPending}
          title="Approve"
          className={`${btn} border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:border-teal-700`}
        >
          <Check size={iconSize} aria-hidden="true" />
        </button>
      )}
      <button
        onClick={() => onDelete(user.id, user.name)}
        disabled={isPending}
        title="Delete"
        className={`${btn} border-red-300 bg-red-50 text-red-600 hover:bg-red-100`}
      >
        <Trash2 size={iconSize} aria-hidden="true" />
      </button>
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

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all',      label: `All (${users.length})` },
    { id: 'pending',  label: `Pending (${pendingCount})` },
    { id: 'active',   label: `Active (${activeCount})` },
    { id: 'rejected', label: `Rejected (${rejectedCount})` },
  ];

  return (
    <div style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s' }}>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`py-1.5 px-4 rounded-full border text-[13px] font-medium cursor-pointer transition-colors ${
              filter === id
                ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">No users found.</p>
        )}
        {filtered.map((user) => {
          const isSelf = user.id === currentUserId;
          const status = userStatus(user);
          return (
            <div
              key={user.id}
              className={`rounded-xl border border-gray-200 bg-white p-4 ${CARD_ROW_BG[status]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.name ?? '—'}
                    {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CARD_STATUS_BADGE[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <select
                  value={user.role}
                  disabled={isSelf || isPending}
                  onChange={(e) => changeRole(user.id, e.target.value as Role)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className="text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {errors[user.id] && (
                <p className="mt-2 text-xs text-red-600">{errors[user.id]}</p>
              )}

              {!isSelf && (
                <div className="mt-3 border-t border-gray-100 pt-3">
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

      {/* Desktop table — original styling restored */}
      <div className="max-md:hidden overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <th style={th}>User</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              <th style={th}>Joined</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}
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
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: ROW_BG[status],
                  }}
                >
                  {/* User info */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                      {user.name ?? '—'}
                      {isSelf && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                          (you)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{user.email}</div>
                    {errors[user.id] && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                        {errors[user.id]}
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <select
                      value={user.role}
                      disabled={isSelf || isPending}
                      onChange={(e) => changeRole(user.id, e.target.value as Role)}
                      style={{
                        fontSize: '0.8125rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>

                  {/* Status badge */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        ...STATUS_BADGE[status],
                      }}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
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
