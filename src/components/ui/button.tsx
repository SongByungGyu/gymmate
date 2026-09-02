import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[14px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]',
  secondary: 'bg-white text-[#17191F] border border-[#E7E7E2] hover:bg-[#F7F7F5]',
  ghost: 'bg-transparent text-[#2563EB] hover:bg-[#EFF6FF]',
  danger: 'bg-white text-[#EF4444] border border-[#FEE2E2] hover:bg-[#FEF2F2]',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-14 px-6 text-[16px]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'lg', className = '', ...props }, ref
) {
  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
});
