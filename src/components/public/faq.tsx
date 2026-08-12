'use client';

import React, { useId, useState } from 'react';

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Bootstrap's accordion needs its JS bundle, which this app does not load —
 * so the open/closed state is driven from React instead.
 */
export const Faq: React.FC<{ items: FaqEntry[] }> = ({ items }) => {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-faq-${index}`;

        return (
          <div className="faq-item" key={item.question}>
            <button
              className="faq-question"
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span>{item.question}</span>
              <i className="bi bi-chevron-down" aria-hidden="true" />
            </button>

            {isOpen && (
              <div className="faq-answer" id={panelId}>
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
