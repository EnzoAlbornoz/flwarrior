// Import Depndencies
import type { FLWarriorDBTables } from "@database/schema";
import type { DBSchema } from "idb";
// Define Schema Type
export enum MachineType {
    FINITE_STATE_MACHINE = "fsm",
    PUSHDOWN_MACHINE = "pdm",
    TURING_MACHINE = "trm",
}

export type MachineMemoryDirection = "left" | "right";
export type MachineDBEntryKey = "id";

export interface MachineDBEntryState {
    id: string;
    isEntry: boolean;
    isExit: boolean;
}

export interface MachineDBEntry {
    id: string;
    type: MachineType;
    deterministic: boolean;
    states: Array<MachineDBEntryState>;
    entryAlphabet: Array<string>;
    memoryAlphabet: Array<string>;
    transitions: Array<{
        from: string;
        with: {
            head: string;
            memory: string;
        };
        to: {
            newState: string;
            writeSymbol: string;
            headDirection: MachineMemoryDirection;
        };
    }>;
}

export interface MachineDBTable extends DBSchema {
    [FLWarriorDBTables.MACHINE]: {
        key: MachineDBEntryKey;
        value: MachineDBEntry;
    };
}
// Export Schema Concrete Object
export default {
    keyPath: "id",
};
