import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getButtonClassName } from './button-styles';
import type { ButtonVariant } from './button-styles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ButtonVariant;
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
      className={getButtonClassName(variant, className)}
      type="button"
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
