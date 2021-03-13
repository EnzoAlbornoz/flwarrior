export type ASymbol = string;

export const EPSILON = "ε";

export const equalsSymbols = (source: ASymbol, destiny: ASymbol): boolean =>
    !source?.localeCompare(destiny);
