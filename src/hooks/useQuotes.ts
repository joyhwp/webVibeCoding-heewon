"use client";

import { useCallback, useMemo, useState } from "react";
import { addQuote, getAllQuotes, removeQuote, type BookQuote } from "@/lib/quotes";
import { useHasMounted } from "@/hooks/useHasMounted";

export function useQuotes() {
  const hasMounted = useHasMounted();
  const [reloadTick, setReloadTick] = useState(0);
  const bump = useCallback(() => setReloadTick((v) => v + 1), []);

  const quotes = useMemo(
    (): BookQuote[] => (hasMounted ? getAllQuotes() : []),
    // reloadTick은 본문에서 안 쓰이지만, 추가/삭제 후 localStorage를 강제로
    // 다시 읽게 하려고 의도적으로 넣은 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMounted, reloadTick]
  );

  const add = useCallback(
    (bookTitle: string, content: string, page?: number) => {
      addQuote(bookTitle, content, page);
      bump();
    },
    [bump]
  );

  const remove = useCallback(
    (id: string) => {
      removeQuote(id);
      bump();
    },
    [bump]
  );

  return { hasMounted, quotes, add, remove };
}
