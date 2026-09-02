import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', ...props }, ref
) {
  return (
    <input
      ref={ref}
      className={`w-full h-14 px-4 rounded-[14px] bg-white border border-[#E7E7E2] text-[#17191F] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] transition ${className}`}
      {...props}
    />
  );
});
