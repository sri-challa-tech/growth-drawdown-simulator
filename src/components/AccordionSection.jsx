import { useState } from 'react';

export default function AccordionSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="acc-section">
      <button className="acc-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{title}</span>
        <span className="acc-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}
