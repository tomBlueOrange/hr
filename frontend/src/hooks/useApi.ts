// Small generic data-fetching hook. Re-runs `fn` whenever `deps` change and
// exposes {data, loading, error, reload}. Ignores results from stale calls so
// rapid range/page changes don't clobber the latest response.

import {useCallback, useEffect, useState} from "react";

export interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
}

export function useApi<T>(fn: () => Promise<T>, deps: ReadonlyArray<unknown>): ApiState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState(0);

    // `fn` is intentionally not in the dep array — callers pass an inline
    // closure that changes every render. `deps` is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const run = useCallback(fn, deps);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        run()
            .then((result) => {
                if (active) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((e: unknown) => {
                if (active) {
                    setError(e instanceof Error ? e.message : String(e));
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [run, nonce]);

    const reload = useCallback(() => setNonce((n) => n + 1), []);

    return {data, loading, error, reload};
}
