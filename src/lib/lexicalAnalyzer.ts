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
    IMachine,
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
): Promise<[Array<ILexToken>, Array<Error>]> => {
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
    let charBuffers = Immutable.List(
        text
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
            .filter((buffer) => buffer)
    );
    // Iterate Over Buffers
    const tokens: Array<{ token: string; class: string }> = [];
    const errors: Array<Error> = [];
    while (!charBuffers.isEmpty()) {
        const buffer = charBuffers.first<string>();
        charBuffers = charBuffers.remove(0);
        // Compute With Machine
        const machineRuntime = nextStep(recognitionMachine, buffer);
        let iteration: IteratorResult<IITransition, boolean> = null;
        let lastAcceptedState: {
            buffer: string;
            state: string;
            idx: number;
        } = null;
        let iterations = 0;
        do {
            // Iterate
            iteration = machineRuntime.next();
            iterations++;
            // Check Done
            if (!iteration.done) {
                // Get Machine State
                const stateId = (iteration.value as IITransition).get("to");
                if (
                    (recognitionMachine.get(
                        "exitStates"
                    ) as IMachine["exitStates"]).has(stateId)
                ) {
                    // Is Exit State
                    lastAcceptedState = {
                        buffer: buffer.slice(0, iterations),
                        state: stateId,
                        idx: iterations,
                    };
                }
            }
        } while (!iteration.done);

        // Check Some Recognition
        if (lastAcceptedState) {
            // Check Need to Continue
            if (buffer.length > lastAcceptedState.buffer.length) {
                // Slice and Insert into buffer list
                const remainingBuffer = buffer.slice(lastAcceptedState.idx);
                charBuffers = charBuffers.unshift(remainingBuffer);
            }
            // Add to Token List
            const statesArray = lastAcceptedState.state
                .split(",")
                .map((state) => state.slice(0, state.indexOf("_")));
            const { className } = regularDefinitions.find((classDef) =>
                statesArray.includes(classDef.className)
            );
            tokens.push({
                token: lastAcceptedState.buffer,
                class: className,
            });
        } else {
            errors.push(
                new SyntaxError(
                    `[LexicalAnalyzer] Token "${buffer}" não reconhecido`
                )
            );
        }
    }
    // Return Token List
    return [tokens, errors];
};
