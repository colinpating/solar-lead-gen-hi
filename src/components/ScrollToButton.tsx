"use client";

import type { ReactNode } from 'react';

type Props = {
  targetId: string;
  className?: string;
  children: ReactNode;
};

export function ScrollToButton({ targetId, className, children }: Props) {
  function onClick() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
