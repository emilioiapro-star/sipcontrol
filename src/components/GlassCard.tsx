import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  className?: string;
}>;

export const GlassCard = ({ className = '', children }: Props) => {
  return <section className={`glass-card ${className}`.trim()}>{children}</section>;
};
