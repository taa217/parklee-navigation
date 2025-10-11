// src/components/ui/button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'rounded-md font-medium focus:outline-none';
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-yellow-600 hover:bg-blue-700 text-white',
    link:    'text-blue-600 hover:underline bg-transparent',
  }[variant];
  const sizes = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  }[size];

  return (
    <button
      className={`${base} ${variants} ${sizes} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
