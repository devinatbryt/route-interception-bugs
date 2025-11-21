"use client";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Fragment } from "react";

export const Wrapper = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  return <Fragment key={searchParams.get("q")}>{children}</Fragment>;
};
