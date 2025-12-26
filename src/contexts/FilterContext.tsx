
"use client";
import type { CalendarFilters, ColorCodingMode } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface FilterContextType {
  filters: CalendarFilters;
  setFilters: Dispatch<SetStateAction<CalendarFilters>>;
  colorMode: ColorCodingMode;
  setColorMode: Dispatch<SetStateAction<ColorCodingMode>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: [],
    subjects: [],
    subTypes: [],
    sections: [],
    dateRange: {},
  });
  const [colorMode, setColorMode] = useState<ColorCodingMode>('category');

  return (
    <FilterContext.Provider value={{ filters, setFilters, colorMode, setColorMode }}>
      {children}
    </FilterContext.Provider>
  );
};
