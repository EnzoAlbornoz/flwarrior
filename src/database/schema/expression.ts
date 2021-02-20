// Import Depndencies
import type { FLWarriorDBTables } from "@database/schema";
import type { DBSchema } from "idb";
// Define Schema Type
export enum ExpressionType {
    REGULAR = "reg",
}
export type ExpressionDBEntryKey = "id";
export interface ExpressionDBEntry {
    id: string;
    name: string;
    type: ExpressionType;
    refName: string;
    body: string;
}

export interface ExpressionDBTable extends DBSchema {
    [FLWarriorDBTables.EXPRESSION]: {
        key: ExpressionDBEntryKey;
        value: ExpressionDBEntry;
    };
}
// Export Schema Concrete Object
export default {
    keyPath: "id",
};
