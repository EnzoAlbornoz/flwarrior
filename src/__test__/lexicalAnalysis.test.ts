/* eslint-disable import/no-extraneous-dependencies */
// Import Dependencies
import { ExpressionType, getNewExpression } from "@/database/schema/expression";
import {
    determinize,
    IIMachine,
    minimize,
    union,
} from "@/lib/automaton/Machine";
import { convertRegularExpressionToDeterministicFiniteMachine } from "@/lib/conversion";
import { fromDBEntry } from "@/lib/expressions/Regex";
import { expect, test } from "@jest/globals";
import Immutable from "immutable";

test("test analyze", async () => {
    const text = "bing bing bong bong";
    const tokens = text
        .replace(/\n/g, " ")
        .split(" ")
        .filter((str) => !!str);
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
                // console.time(`[convert][${regex}]`);
                // Convert to DFA
                let machine = convertRegularExpressionToDeterministicFiniteMachine(
                    // Convert to regex
                    fromDBEntry(newExpression)
                );
                // console.timeEnd(`[convert][${regex}]`);
                // console.time(`[minimize][${regex}]`);
                machine = minimize(machine);
                // console.timeEnd(`[minimize][${regex}]`);
                return machine;
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
    console.time("mega");
    const megaMachine = determinize(regexUnion);
    console.timeEnd("mega");
});
