'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type SearchResultItem = {
  id: string;
  type: 'task' | 'todo' | 'worklog' | 'achievement' | 'note';
  title: string;
  meta: string | null;
  href: string;
};

const TYPE_LABELS: Record<SearchResultItem['type'], string> = {
  task: 'Tasks',
  todo: 'To-dos',
  worklog: 'Work Logs',
  achievement: 'Achievements',
  note: 'Notes',
};

const TYPE_ORDER: SearchResultItem['type'][] = ['task', 'todo', 'worklog', 'achievement', 'note'];

export function GlobalSearch(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results: SearchResultItem[] };
        setResults(data.results ?? []);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const grouped = TYPE_ORDER.reduce<Partial<Record<SearchResultItem['type'], SearchResultItem[]>>>(
    (acc, type) => {
      const items = results.filter((r) => r.type === type);
      if (items.length) acc[type] = items;
      return acc;
    },
    {},
  );

  const hasResults = results.length > 0;
  const showResults = query.trim().length >= 2;

  return (
    <div>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a1a1aa',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search tasks, notes, work logs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: '0.5rem',
            border: '1px solid #e4e4e7',
            backgroundColor: '#ffffff',
            padding: '0.5rem 1rem 0.5rem 2.25rem',
            fontSize: '0.875rem',
            color: '#18181b',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0d9488')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
        />
      </div>

      {/* Results */}
      {showResults && (
        <div style={{ marginTop: '1.25rem' }}>
          {loading && (
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Searching…</p>
          )}

          {!loading && searched && !hasResults && (
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!loading && hasResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {TYPE_ORDER.map((type) => {
                const items = grouped[type];
                if (!items?.length) return null;
                return (
                  <div key={type}>
                    <p
                      style={{
                        marginBottom: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#a1a1aa',
                      }}
                    >
                      {TYPE_LABELS[type]}
                    </p>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        borderRadius: '0.5rem',
                        border: '1px solid #e4e4e7',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {items.map((r, i) => (
                        <li
                          key={r.id}
                          style={{
                            borderTop: i > 0 ? '1px solid #f4f4f5' : 'none',
                          }}
                        >
                          <Link
                            href={r.href}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.625rem 1rem',
                              fontSize: '0.875rem',
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = '#f9fafb')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                          >
                            <span style={{ fontWeight: 500, color: '#18181b' }}>
                              {r.title}
                            </span>
                            {r.meta && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#a1a1aa',
                                  flexShrink: 0,
                                  marginLeft: '0.75rem',
                                }}
                              >
                                {r.meta}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
