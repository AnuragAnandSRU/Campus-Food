import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs" className="mb-6 flex items-center flex-wrap gap-2 text-sm text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-ink' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className="text-muted/60 select-none">/</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
