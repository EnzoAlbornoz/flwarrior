// Import Dependencies
import Immutable from "immutable";
import { FLWarriorDBSchema, FLWarriorDBTables } from "@/database/schema";
import type { IDBPDatabase } from "idb";
import { fromDBEntry as regexFromDBEntry } from "./expressions/Regex";
import {
    fromDBEntry as machineFromDBEntry,
    minimize,
    union,
    renameAllStates,
    determinize,
    renameAllStatesExceptExit,
    nextStep,
    IITransition,
} from "./automaton/Machine";
import type { IIMachine } from "./automaton/Machine";
import { convertRegularExpressionToDeterministicFiniteMachine } from "./conversion";
// Define Types
export enum EClassDefinitionType {
    REGEX = "REGEX",
    MACHINE = "MACHINE",
}
export interface IClassDefinition {
    className: string;
    refId: string;
    type: EClassDefinitionType;
}
export interface ILexToken {
    class: string;
    token: string;
}
export const tokenize = async (
    text: string,
    regularDefinitions: Immutable.List<IClassDefinition>,
    db: IDBPDatabase<FLWarriorDBSchema>
): Promise<Array<ILexToken>> => {
    // Create Recognition Machine
    let recognitionMachine = (
        await Promise.all(
            regularDefinitions
                .toIndexedSeq()
                .map(async ({ className, refId, type }, idx) => {
                    // Import the Machine
                    let machine: IIMachine;
                    if (type === EClassDefinitionType.REGEX) {
                        // If Regex, Build a Machine
                        const regexDBEntry = await db.get(
                            FLWarriorDBTables.EXPRESSION,
                            refId
                        );
                        const regex = regexFromDBEntry(regexDBEntry);
                        // Convert Regex to Machine
                        machine = minimize(
                            convertRegularExpressionToDeterministicFiniteMachine(
                                regex,
                                true
                            )
                        );
                    } else if (type === EClassDefinitionType.MACHINE) {
                        // Import Machine
                        const machineDBEntry = await db.get(
                            FLWarriorDBTables.MACHINE,
                            refId
                        );
                        machine = machineFromDBEntry(machineDBEntry);
                    } else {
                        throw new TypeError(
                            "Invalid Type for Class Definition"
                        );
                    }
                    // Optimize Machine
                    machine = renameAllStates(
                        machine,
                        `q${idx}`,
                        className,
                        "_"
                    );
                    // Return Machine
                    return machine;
                })
        )
    ).reduce((accMachine, iterMachine, idx) =>
        // Union and Determinization
        union(accMachine, iterMachine, true, `qu-${idx}`)
    );
    // Rename States
    recognitionMachine = renameAllStatesExceptExit(
        determinize(recognitionMachine)
    );
    // Splitting Text into Analizable Buffers
    const charBuffers = text
        .split("")
        .reduce(
            (buffers, char) => {
                if ([" ", "\n"].includes(char)) {
                    buffers.push("");
                } else {
                    const lastBuffer = buffers.pop();
                    buffers.push(lastBuffer.concat(char));
                }
                return buffers;
            },
            [""]
        )
        .filter((buffer) => buffer);
    // Iterate Over Buffers
    const tokens: Array<{ token: string; class: string }> = [];
    for (const buffer of charBuffers) {
        // Compute With Machine
        const machineRuntime = nextStep(recognitionMachine, buffer);
        let iteration = machineRuntime.next();
        let accepted = iteration.done && iteration.value;
        while (!iteration.done) {
            // Iterate
            const nextIteration = machineRuntime.next();
            // Check Next Done
            if (nextIteration.done) {
                if (nextIteration.value) {
                    accepted = true;
                    break;
                }
            } else {
                iteration = nextIteration;
            }
        }
        // Check Accepted
        if (accepted) {
            // Check Accepted Class
            const lastState = (iteration.value as IITransition).get("to");
            const statesArray = lastState
                .split(",")
                .map((state) => state.slice(0, state.indexOf("_")));
            const { className } = regularDefinitions.find((classDef) =>
                statesArray.includes(classDef.className)
            );
            tokens.push({
                token: buffer,
                class: className,
            });
        }
    }
    // Return Token List
    return tokens;
};
