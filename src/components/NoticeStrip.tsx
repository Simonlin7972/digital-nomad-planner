import type { ReactNode } from 'react';
import './NoticeStrip.css';

type Props = {
  icon: ReactNode;
  children: ReactNode; // the message: a <b> lead, then the rest
  actions: ReactNode; // its buttons
};

// A strip under the header for something the plan needs doing: a backup that is overdue, a sync waiting on a
// choice. Shown inside a `.reminder-slot` Presence so it folds shut when it goes.
export function NoticeStrip({ icon, children, actions }: Props) {
  return (
    <div className="notice-strip" role="status">
      {icon}
      <p>{children}</p>
      {actions}
    </div>
  );
}
