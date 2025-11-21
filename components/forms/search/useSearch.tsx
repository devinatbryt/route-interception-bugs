"use client";

import { createContext, useContext, type TransitionStartFunction } from "react";
import { useFormContext } from "react-hook-form";
import { SearchSchema } from "./schema";

type SearchContextType = [
  {
    id: string;
    isPending: boolean;
  },
  {
    startTransition: TransitionStartFunction;
  },
];

export const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useAddToCart must be used within an AddToCartProvider");
  }

  return context;
};

export const useSearchForm = () =>
  useFormContext<typeof SearchSchema.Encoded>();
