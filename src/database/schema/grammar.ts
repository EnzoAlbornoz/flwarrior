// Import Depndencies
import type { FLWarriorDBTables } from "@database/schema";
import type { DBSchema } from "idb";
import { v4 as uuid } from "uuid";
// Define Schema Type
export enum GrammarType {
    REGULAR = "reg",
    CONTEXT_FREE = "ctxf",
    CONTEXT_SENSITIVE = "ctxs",
    UNRESTRICTED = "urtd",
}
export type Char = string;
export interface GrammarDBEntry {
    id: string;
    name: string;
    type: GrammarType;
    startSymbol: string;
    alphabetNT: Array<Char>;
    alphabetT: Array<Char>;
    transitions: Array<{
        from: Array<Char>;
        to: Array<Array<Char>>;
    }>;
}

export interface GrammarDBTable extends DBSchema {
    [FLWarriorDBTables.GRAMMAR]: {
        key: string;
        value: GrammarDBEntry;
    };
}

export function getNewGrammar(type: GrammarType): GrammarDBEntry {
    const grammarId = uuid();
    return {
        id: grammarId,
        type,
        name: grammarId,
        startSymbol: "S",
        alphabetNT: ["S"],
        alphabetT: [],
        transitions: [],
    };
}
// Export Schema Concrete Object
export default {
    keyPath: "id",
};
