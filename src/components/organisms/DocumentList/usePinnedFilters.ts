import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SearchParam = "s";

export function usePinnedFilters(): [string[], (pinned: string[]) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updatePinned = useCallback(
    (pinned: string[]) => {
      // seems like this should be easier
      const updated = new URLSearchParams(searchParams?.toString());
      updated.delete(SearchParam);
      for (const p of pinned) {
        updated.append(SearchParam, p);
      }
      router.push(`${pathname}?${updated.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return [searchParams?.getAll(SearchParam) ?? [], updatePinned];
}
