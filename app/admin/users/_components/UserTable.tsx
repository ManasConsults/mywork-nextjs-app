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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
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
                      {status === 'ACTIVE' ? 'Active' : status === 'PENDING' ? 'Pending' : 'Rejected'}
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
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => toggleActive(user.id, false)}
                              disabled={isPending}
                              title="Approve"
                              className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <Check size={18} aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              disabled={isPending}
                              title="Reject"
                              className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-red-300 bg-white text-red-600 hover:bg-red-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <X size={18} aria-hidden="true" />
                            </button>
                          </>
                        )}
                        {status === 'ACTIVE' && (
                          <button
                            onClick={() => toggleActive(user.id, true)}
                            disabled={isPending}
                            title="Deactivate"
                            className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-red-300 bg-white text-red-600 hover:bg-red-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          >
                            <Ban size={18} aria-hidden="true" />
                          </button>
                        )}
                        {status === 'REJECTED' && (
                          <button
                            onClick={() => toggleActive(user.id, false)}
                            disabled={isPending}
                            title="Approve"
                            className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          >
                            <Check size={18} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          disabled={isPending}
                          title="Delete"
                          className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-red-300 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
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
