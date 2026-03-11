'use client';

import { createContext, useContext } from 'react';

interface FinanceContextValue {
  employmentType: 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH';
  isSoleTrader: boolean;
  isDualRole: boolean;
  currency: string;
}

const FinanceContext = createContext<FinanceContextValue>({
  employmentType: 'EMPLOYED',
  isSoleTrader: false,
  isDualRole: false,
  currency: 'GBP',
});

export function useFinance(): FinanceContextValue {
  return useContext(FinanceContext);
}

export function FinanceProvider({
  employmentType,
  currency,
  children,
}: {
  employmentType: 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH';
  currency: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const value: FinanceContextValue = {
    employmentType,
    isSoleTrader: employmentType !== 'EMPLOYED',
    isDualRole: employmentType === 'BOTH',
    currency,
  };
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
