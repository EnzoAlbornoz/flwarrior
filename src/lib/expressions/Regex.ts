/* eslint-disable no-await-in-loop */
// Import Dependencies
import Immutable from "immutable";
import {
    DefinitionType,
    ExpressionDBEntry,
    ExpressionType,
} from "@/database/schema/expression";
import { IDBPDatabase } from "idb";
import { FLWarriorDBSchema, FLWarriorDBTables } from "@/database/schema";
// Define Types
export interface IRegexDefinition {
    type: DefinitionType;
    content: string;
}
export type IIRegexDefinition = Immutable.Map<
    keyof IRegexDefinition,
    IRegexDefinition[keyof IRegexDefinition]
>;
export interface IRegex {
    id: string;
    name: string;
    type: ExpressionType.REGULAR;
    expression: string;
    definitions: Immutable.Map<string, IIRegexDefinition>;
}
export type IIRegex = Immutable.Map<keyof IRegex, IRegex[keyof IRegex]>;

// Define Basic Functions
export const rename = (regex: IIRegex, newName: string): IIRegex =>
    regex.set("name", newName);

export const addDefinition = (
    regex: IIRegex,
    definitionReference: string,
    definitionType: DefinitionType,
    definitionContent: string
): IIRegex =>
    regex.update("definitions", (definitions: IRegex["definitions"]) =>
        definitions.set(
            definitionReference,
            Immutable.Map({
                type: definitionType,
                content: definitionContent,
            }) as IIRegexDefinition
        )
    );

export const removeDefinition = (
    regex: IIRegex,
    definitionReference: string
): IIRegex =>
    regex.update("definitions", (definitions: IRegex["definitions"]) =>
        definitions.delete(definitionReference)
    );

export const setExpression = (regex: IIRegex, newExpression: string): IIRegex =>
    regex.set("expression", newExpression);
// Database Functions
export const fromDBEntry = (entry: ExpressionDBEntry): IIRegex => {
    const regex = Immutable.Map({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        expression: entry.expression,
        definitions: Immutable.Map(entry.definitions).map((ed) =>
            Immutable.Map({ type: ed.type, content: ed.content })
        ),
    }) as IIRegex;
    // Return Builded Regex
    return regex;
};

export const toDBEntry = (regex: IIRegex): ExpressionDBEntry => {
    const entry: ExpressionDBEntry = {
        id: regex.get("id") as string,
        name: regex.get("name") as string,
        type: regex.get("type") as ExpressionType,
        expression: regex.get("expression") as string,
        definitions: (regex.get(
            "definitions"
        ) as IRegex["definitions"]).toJS() as ExpressionDBEntry["definitions"],
    };
    // Return serialized regex
    return entry;
};
// Special Functions
export const resolveDefinitions = async (
    regex: IIRegex,
    database: IDBPDatabase<FLWarriorDBSchema>
): Promise<IIRegex> => {
    // Find External Definitions
    const externalDefinitions = (regex.get(
        "definitions"
    ) as IRegex["definitions"]).filter((def) => def.get("type") === "GLOBAL");
    // Get Resolved Definitions
    let resolvedDefinitions = (regex.get(
        "definitions"
    ) as IRegex["definitions"])
        .filter((def) => def.get("type") === "LOCAL")
        .map((def) => def.get("content"));
    // Resolve Definitions
    for (const [defName, ext] of externalDefinitions) {
        const extId = ext.get("content");
        const extDBEntry = await database.get(
            FLWarriorDBTables.EXPRESSION,
            extId
        );
        const extRegex = fromDBEntry(extDBEntry);
        const resolvedExtRegex = await resolveDefinitions(extRegex, database);
        resolvedDefinitions = resolvedDefinitions.set(
            defName,
            resolvedExtRegex.get("expression") as string
        );
    }
    // Replace Definitions
    let resolvedRegex = regex;
    for (const [defAlias, defExpression] of resolvedDefinitions) {
        resolvedRegex = resolvedRegex.update("expression", (exp: string) =>
            exp.split(`{${defAlias}}`).join(defExpression)
        );
    }
    // Return Resolved Regex
    return resolvedRegex;
};
