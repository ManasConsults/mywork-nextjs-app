import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import type { Category } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { getCategories, seedDefaultCategories } from '@/lib/services/finance/category.service';
import { CategoryForm } from './_components/CategoryForm';
import { DeleteCategoryButton } from './_components/DeleteCategoryButton';

export const metadata: Metadata = { title: 'MyWork — Categories' };

type CategoryWithChildren = Category & { children: Category[] };

const TYPE_META = {
  PERSONAL: {
    label: 'Personal',
    badgeCls:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    dotCls: 'bg-blue-400',
  },
  WORK_RELATED: {
    label: 'Work-Related',
    badgeCls:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    dotCls: 'bg-amber-400',
  },
  BUSINESS: {
    label: 'Business',
    badgeCls:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    dotCls: 'bg-green-400',
  },
} as const;

type CategoryType = keyof typeof TYPE_META;

interface CategoriesPageProps {
  searchParams: Promise<{ add?: string }>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const employmentType = session!.user.employmentType;

  await seedDefaultCategories(userId, employmentType as 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH');

  const [allCategories, { add }] = await Promise.all([
    getCategories(userId) as Promise<CategoryWithChildren[]>,
    searchParams,
  ]);

  const showAddForm = add === '1';

  const grouped: Record<CategoryType, CategoryWithChildren[]> = {
    PERSONAL: [],
    WORK_RELATED: [],
    BUSINESS: [],
  };

  for (const cat of allCategories) {
    if (cat.type in grouped) {
      grouped[cat.type as CategoryType].push(cat);
    }
  }

  const visibleTypes: CategoryType[] =
    employmentType === 'EMPLOYED'
      ? ['PERSONAL', 'WORK_RELATED']
      : ['PERSONAL', 'WORK_RELATED', 'BUSINESS'];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!showAddForm && (
          <Link
            href="/finance/categories?add=1"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            New Category
          </Link>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              New Category
            </h2>
            <Link
              href="/finance/categories"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
          <CategoryForm employmentType={employmentType} />
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-8">
        {visibleTypes.map((type) => {
          const meta = TYPE_META[type];
          const categories = grouped[type];

          return (
            <section key={type} aria-labelledby={`heading-${type}`}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  id={`heading-${type}`}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badgeCls}`}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                </span>
              </div>

              {categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {meta.label.toLowerCase()} categories yet.
                  </p>
                  {!showAddForm && (
                    <Link
                      href="/finance/categories?add=1"
                      className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-2 hover:text-primary"
                    >
                      Add category
                    </Link>
                  )}
                </div>
              ) : (
                <ul
                  role="list"
                  className="divide-y divide-border/60 rounded-xl border border-border bg-card"
                >
                  {categories.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Colour dot */}
                        <span
                          className={`h-3 w-3 shrink-0 rounded-full ${!cat.colour ? meta.dotCls : ''}`}
                          style={cat.colour ? { backgroundColor: cat.colour } : undefined}
                          aria-hidden="true"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {cat.name}
                          </p>
                          {cat.children.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {cat.children.length}{' '}
                              {cat.children.length === 1
                                ? 'subcategory'
                                : 'subcategories'}
                            </p>
                          )}
                        </div>
                      </div>

                      <DeleteCategoryButton id={cat.id} name={cat.name} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
