import { type ReactNode } from 'react';

type Props = {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
};

export default function Panel({ icon, title, badge, children, className = '', accent }: Props) {
  return (
    <div className={`panel ${accent ? 'panel-accent' : ''} ${className}`}>
      <div className="panel-header">
        {icon && <span className="icon">{icon}</span>}
        <span className="flex-1">{title}</span>
        {badge}
      </div>
      <div className="panel-body">
        {children}
      </div>
    </div>
  );
}
