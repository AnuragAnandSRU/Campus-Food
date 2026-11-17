import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs" className="mb-6 flex items-center flex-wrap gap-1.5 text-sm text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center gap-1.5">
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
              <ChevronRight className="h-3.5 w-3.5 text-muted/60 select-none" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

