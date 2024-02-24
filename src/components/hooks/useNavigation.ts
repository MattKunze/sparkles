import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

export function useNavigation() {
  const searchParams = useSearchParams();

  const resolvePath = useCallback(
    (href: string) => {
      const searchFragment = searchParams ? `?${searchParams.toString()}` : "";
      return href + searchFragment;
    },
    [searchParams]
  );

  return { resolvePath };
}
