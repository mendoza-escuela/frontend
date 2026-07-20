import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
};

const variantClasses = {
  primary:
    'bg-[#000F9F] text-white shadow-sm shadow-[#000F9F]/20 hover:bg-[#000C80] focus-visible:outline-[#000F9F]',
  secondary:
    'bg-[#3CB4E5] text-[#1F2937] shadow-sm hover:bg-[#2da4d5] focus-visible:outline-[#000F9F]',
  outline:
    'border border-[#000F9F] bg-white text-[#000F9F] hover:bg-[#EEF0FF] focus-visible:outline-[#000F9F]',
};

export function Button({
  children,
  className = '',
  icon,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      type="button"
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
