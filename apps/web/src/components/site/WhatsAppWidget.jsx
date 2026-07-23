"use client";

import { useEffect, useRef, useState } from "react";

/** Floating WhatsApp button that opens an upward branch picker. */
export function WhatsAppWidget({ branches = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const list = branches.filter((b) => b.whatsapp);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const single = list.length <= 1;
  const href = single && list[0] ? `https://wa.me/${list[0].whatsapp}` : undefined;

  return (
    <div ref={ref}>
      {open && list.length > 1 && (
        <div className="ba-wa-pop open" role="menu">
          <div className="ba-wa-pop-h">Filial seç · WhatsApp</div>
          {list.map((b) => (
            <a
              key={b._id || b.whatsapp}
              href={`https://wa.me/${b.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="ba-wa-pop-ic">
                <svg viewBox="0 0 32 32" width="17" height="17" fill="#fff">
                  <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l7.9-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5z" />
                </svg>
              </span>
              <span>{b.name}</span>
            </a>
          ))}
        </div>
      )}

      <a
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener noreferrer" : undefined}
        aria-label="WhatsApp"
        className="ba-wa"
        onClick={(e) => {
          if (!single) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        style={{ position: "fixed", right: 22, bottom: 56, zIndex: 90, width: 72, height: 72, borderRadius: "50%", background: "#25D366", display: "grid", placeItems: "center", boxShadow: "0 14px 32px rgba(37,211,102,.5)", cursor: "pointer" }}
      >
        <svg viewBox="0 0 32 32" width="38" height="38" fill="#fff">
          <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l7.9-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.1 5.8-12.9 13-12.9s12.9 5.8 12.9 12.9-5.8 12.9-13 13z" />
        </svg>
      </a>
    </div>
  );
}
