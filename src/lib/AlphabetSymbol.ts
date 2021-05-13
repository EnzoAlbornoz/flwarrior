export type ASymbol = string;

export const EPSILON = "ε";
export const END_OF_STACK = "$";

export const equalsSymbols = (source: ASymbol, destiny: ASymbol): boolean =>
    !source?.localeCompare(destiny);
