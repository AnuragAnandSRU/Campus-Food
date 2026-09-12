import { cn } from '@/lib/utils';

interface SubmitButtonProps {
  pending?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Full-width primary submit button with an inline loading spinner. */
export function SubmitButton({ pending, children, className }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'btn btn-primary w-full',
        pending && 'cursor-not-allowed opacity-70 hover:translate-y-0',
        className
      )}
    >
      {pending && (
        <span
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
