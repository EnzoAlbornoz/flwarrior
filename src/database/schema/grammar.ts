// Import Depndencies
import type { FLWarriorDBTables } from "@database/schema";
import type { DBSchema } from "idb";
// Define Schema Type
export enum GrammarType {
    REGULAR = "reg",
    CONTEXT_FREE = "ctxf",
    CONTEXT_SENSITIVE = "ctxs",
}
export type GrammarDBEntryKey = "id";
export interface GrammarDBEntry {
    id: string;
    type: GrammarType;
    alphabetNT: Array<string>;
    alphabetT: Array<string>;
    transitions: Array<{
        from: Array<string>;
        to: Array<string>;
    }>;
}

export interface GrammarDBTable extends DBSchema {
    [FLWarriorDBTables.GRAMMAR]: {
        key: GrammarDBEntryKey;
        value: GrammarDBEntry;
    };
}
// Export Schema Concrete Object
export default {
    keyPath: "id",
};
