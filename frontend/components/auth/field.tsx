'use client';

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

/**
 * Labelled text input matching the warm design system. When `type="password"`
 * it renders an accessible Show/Hide toggle.
 */
export function Field({ label, name, error, hint, type = 'text', ...props }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          className={cn(
            'input',
            isPassword && 'pr-16',
            error && 'border-danger focus:border-danger'
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${name}-error` : hint ? `${name}-hint` : undefined
          }
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-muted transition-colors hover:text-accent"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
