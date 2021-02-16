// Import Dependencies
import MachineDBMeta from "./machine";
import GrammarDBMeta from "./grammar";
import ExpressionDBMeta from "./expression";
import type { MachineDBTable } from "./machine";
import type { GrammarDBTable } from "./grammar";
import type { ExpressionDBTable } from "./expression";
// Define Tables
export enum FLWarriorDBTables {
    MACHINE = "machine",
    GRAMMAR = "grammar",
    EXPRESSION = "expression",
}
// Define Schema
export interface FLWarriorDBSchema
    extends MachineDBTable,
        GrammarDBTable,
        ExpressionDBTable {}
// Export Concrete Objects from Tables
export default {
    [FLWarriorDBTables.MACHINE]: MachineDBMeta,
    [FLWarriorDBTables.GRAMMAR]: GrammarDBMeta,
    [FLWarriorDBTables.EXPRESSION]: ExpressionDBMeta,
};
