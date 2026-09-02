import { avatarColor, initials } from '@/lib/utils/avatar-color';

type Props = {
  name: string;
  size?: 32 | 40 | 48;
  className?: string;
};

export function Avatar({ name, size = 40, className = '' }: Props) {
  const { bg, fg } = avatarColor(name);
  const text = initials(name);
  const px = `${size}px`;
  const fontSize = size <= 32 ? 12 : size <= 40 ? 14 : 16;
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${className}`}
      style={{ width: px, height: px, background: bg, color: fg, fontSize }}
    >
      {text}
    </div>
  );
}
