import { useEffect } from "react";
import type { DependencyList } from "react";

export default function useAsyncEffect(
    effect: () => Promise<unknown>,
    deps?: DependencyList,
    destructor?: () => void
): void {
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        // Call async effect
        effect();
        // Return destructor if exists
        if (destructor) {
            return destructor;
        }
    }, deps);
}
