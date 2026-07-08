import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
};

const variantClasses = {
  primary:
    'bg-[#007C89] text-white shadow-sm shadow-[#007C89]/20 hover:bg-[#006874] focus-visible:outline-[#007C89]',
  secondary:
    'bg-[#003A70] text-white shadow-sm shadow-[#003A70]/20 hover:bg-[#002f5c] focus-visible:outline-[#003A70]',
  outline:
    'border border-[#007C89] bg-white text-[#007C89] hover:bg-[#D8F1F7] focus-visible:outline-[#007C89]',
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
