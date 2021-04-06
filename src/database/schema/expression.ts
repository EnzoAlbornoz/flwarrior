// Import Depndencies
import type { FLWarriorDBTables } from "@database/schema";
import type { DBSchema } from "idb";
import { v4 as uuid } from "uuid";
// Define Schema Type
export enum ExpressionType {
    REGULAR = "reg",
}
export type DefinitionType = "LOCAL" | "GLOBAL";
export interface ExpressionDBEntryDefinition {
    type: DefinitionType;
    content: string;
}
export interface ExpressionDBEntry {
    id: string;
    name: string;
    type: ExpressionType;
    expression: string;
    definitions: Record<string, ExpressionDBEntryDefinition>;
}

export interface ExpressionDBTable extends DBSchema {
    [FLWarriorDBTables.EXPRESSION]: {
        key: string;
        value: ExpressionDBEntry;
    };
}

export function getNewExpression(type: ExpressionType): ExpressionDBEntry {
    const expressionId = uuid();
    return {
        id: expressionId,
        type,
        name: expressionId,
        definitions: {},
        expression: "",
    };
}
// Export Schema Concrete Object
export default {
    keyPath: "id",
};
