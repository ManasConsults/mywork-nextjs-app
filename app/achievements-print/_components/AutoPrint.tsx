'use client';

import { useEffect } from 'react';

export function AutoPrint(): null {
  useEffect(() => {
    window.print();
  }, []);

  return null;
}
