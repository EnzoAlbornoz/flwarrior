import { OrderedSet } from "immutable";
import type { ASymbol } from "./AlphabetSymbol";

export type IAlphabet = OrderedSet<ASymbol>;
export const createAlphabet = (...symbols: ASymbol[]): OrderedSet<string> =>
    OrderedSet(symbols);
