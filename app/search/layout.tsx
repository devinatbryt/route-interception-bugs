import { Suspense, type ReactNode } from "react";
import * as Search from "@/components/search";
import { SearchForm } from "@/components/forms";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="search-layout">
      <SearchForm.Root>
        <SearchForm.QueryInput placeholder="Hello world" />
      </SearchForm.Root>
      <Suspense>
        <Search.Wrapper>{children}</Search.Wrapper>
      </Suspense>
    </div>
  );
}
