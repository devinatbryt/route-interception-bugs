import { Suspense, type ReactNode } from "react";
import * as Search from "@/components/search";
import { SearchForm } from "@/components/forms";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <aside className="search-layout flex-1">
        <SearchForm.Root>
          <SearchForm.QueryInput placeholder="Hello world" />
        </SearchForm.Root>
        <Search.Wrapper>{children}</Search.Wrapper>
      </aside>
    </Suspense>
  );
}
