import Immutable from "immutable";
import { v4 as uuid } from "uuid";
import {
    ExpressionDBEntry,
    ExpressionType,
    getNewExpression,
} from "@/database/schema/expression";
import {
    MachineDBEntry,
    MachineType,
    MachineMemoryDirection,
} from "../database/schema/machine";
import { IIState, IState } from "./automaton/State";
import { IAlphabet } from "./Alphabet";
import { ASymbol, EPSILON } from "./AlphabetSymbol";
import convertRegularExpressionToNonDeterministicFiniteMachine from "./conversion/regexToMachine";
import { fromDBEntry } from "./expressions/Regex";
import { determinize, IIMachine, minimize, union } from "./automaton/Machine";

// eslint-disable-next-line import/prefer-default-export
export const analyze = async (
    text: string
): Promise<Immutable.List<string>> => {
    const tokens = text
        .replace(/\n/g, " ")
        .split(" ")
        .filter((str) => !!str);
    // console.log(tokens);

    // Create regex List
    const regexes = [
        ";",
        "begin",
        "end",
        "if",
        "else",
        "program",
        "procedure",
        "int",
        "string",
        "(_|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z)(_|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9)*",
        "=",
        "==",
        "!=",
        "<",
        "not",
        "+",
        "-",
        // "\*",
    ];
    const minimizedMachines = Immutable.List<IIMachine>(
        await Promise.all(
            regexes.map(async (regex) => {
                const newExpression = getNewExpression(ExpressionType.REGULAR);
                newExpression.expression = regex;
                // Ensure the DFA is minimal by minimizing
                return minimize(
                    // Convert to DFA
                    convertRegularExpressionToNonDeterministicFiniteMachine(
                        // Convert to regex
                        fromDBEntry(newExpression)
                    )
                );
            })
        )
    );
    // minimizedMachines.forEach((m) => console.log(m.toJS()));
    // Union these machines
    let i = 0;
    const regexUnion = minimizedMachines.reduce(
        (accum: IIMachine, nextMachine) => {
            return union(accum, nextMachine, false, `Ini${i++}`);
        }
    );
    // console.log(regexUnion.toJS());
    // Determinize the result
    const megaMachine = determinize(regexUnion);
    // console.log(megaMachine.toJS());

    // Immutable.Set<
    return Immutable.List<string>();
};
