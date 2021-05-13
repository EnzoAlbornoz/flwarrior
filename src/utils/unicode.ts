import unicodeLu from "unicode/category/Lu";
import unicodeLl from "unicode/category/Ll";

export interface UnicodeInfo {
    symbol: string;
    value: string;
    name: string;
}

export function getUnicodeLettersUpper(
    filterSymbols: Array<string> = []
): Array<string> {
    // Shallow Copy
    const unicodeCopy: Record<number, UnicodeInfo> = { ...unicodeLu };
    // Filter Symbols
    for (const symbol of filterSymbols) {
        delete unicodeCopy[symbol.charCodeAt(0)];
    }
    // Return Symbols
    return Object.values(unicodeCopy).map(({ symbol }) => symbol);
}

export function getUnicodeLettersLower(
    filterSymbols: Array<string> = []
): Array<string> {
    // Shallow Copy
    const unicodeCopy: Record<number, UnicodeInfo> = { ...unicodeLl };
    // Filter Symbols
    for (const symbol of filterSymbols) {
        delete unicodeCopy[symbol.charCodeAt(0)];
    }
    // Return Symbols
    return Object.values(unicodeCopy).map(({ symbol }) => symbol);
}
