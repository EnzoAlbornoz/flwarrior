// Import Dependencies
import Immutable from "immutable";
import { IMachine } from "@/lib/automaton/Machine";
import { inspect } from "util";
import { EPSILON } from "@/lib/AlphabetSymbol";
import { convertRegularExpressionToNonDeterministicFiniteMachine } from "@/lib/conversion";
import { fromDBEntry } from "@/lib/expressions/Regex";
import { ExpressionType } from "@/database/schema/expression";
import {
    fromDBEntry as grammarFromDB,
    IGrammar,
} from "../../lib/grammar/Grammar";
import {
    searchForParentheses,
    searchForClojures,
    searchForOr,
    searchForConcatenations,
    buildAhoTree,
    getLeafNodes,
    updateFollowPos,
} from "../../lib/conversion/regexToMachine";
// Execute Debugs (NOT REAL TESTS)
test("[searchForParentheses] Test Shallow Array", () => {
    // Setup
    const regexStr = "ab(a|b)*bb".split("");
    // SUT
    const result = searchForParentheses(regexStr);
    // Assert
    // console.log(result);
});

test("[searchForParentheses] Test Nested Array", () => {
    // Setup
    const regexStr = "ab((a|b)zzzb)*bb".split("");
    // SUT
    const result = searchForParentheses(regexStr);
    // Assert
    // console.log(result);
});

test("[searchForClojures] Test Shallow Array", () => {
    // Setup
    const regexArr = [
        "a",
        "b",
        [["a", "|", "b"], "z", "z", "z", "b"],
        "*",
        "b",
        "b",
    ];
    // SUT
    const result = searchForClojures(regexArr);
    // Assert
    // console.log(inspect(result, { depth: null, colors: true }));
});

test("[searchForClojures] Test Nested Array", () => {
    // Setup
    const regexArr = [
        "a",
        "b",
        [["a", "|", "b"], "z", "z", ["a", "b"], "*", "b"],
        "*",
        "b",
        "b",
    ];
    // SUT
    const result = searchForClojures(regexArr);
    // Assert
    // console.log(inspect(result, { depth: null, colors: true }));
});

test("[searchForOr] Test Shallow Array", () => {
    // Setup
    const regexArr = [
        "a",
        "b",
        [[["a", "|", "b"], "z", "z", [["a", "b"], "*"], "b"], "*"],
        "b",
        "b",
    ];
    // SUT
    const result = searchForOr(regexArr);
    // Assert
    // console.log(inspect(result, { depth: null, colors: true }));
});

test("[searchForOr] Test Nested Array", () => {
    // Setup
    const regexArr = [
        "a",
        "b",
        [[["a", "|", "b"], "z", "z", [["a", "b"], "*"], "b"], "*"],
        "b",
        "b",
    ];
    // SUT
    const result = searchForOr(regexArr);
    // Assert
    // console.log(inspect(result, { depth: null, colors: true }));
});

test("[searchForConcatenations] Test Nested Array", () => {
    // Setup
    const regexArr = [
        "a",
        "b",
        [[[["a"], ["b"], "|"], "z", "z", [["a", "b"], "*"], "b"], "*"],
        "b",
        "b",
    ];
    // SUT
    const result = searchForConcatenations(regexArr);
    // Assert
    // console.log(inspect(result, { depth: null, colors: true }));
});

test("[testAllTree] ", () => {
    // Setup
    const expandedExpression = "(a|b)*abb#".split("");
    // SUT
    const parsedNestings = searchForParentheses(expandedExpression);
    const parsedClojure = searchForClojures(parsedNestings);
    const parsedOr = searchForOr(parsedClojure);
    const parsedConcatenations = searchForConcatenations(parsedOr);
    // Log
    // console.log(inspect(parsedConcatenations, { depth: null, colors: true }));
});

test("[buildAhoTree] Test Working", () => {
    // Setup
    const regex = "(a|b)*abb";
    // SUT
    const tree = buildAhoTree(regex);
    // Log
    // console.log(inspect(tree, { depth: null, colors: true }));
});

test("[getLeafNodes] Test Working", () => {
    // Setup
    const regex = "(a|b)*abb";
    const tree = buildAhoTree(regex);
    // SUT
    const leafNodes = getLeafNodes(tree);
    // Log
    // console.log(inspect(leafNodes, { depth: null, colors: true }));
});

test("[updateFollowPos] Test Working", () => {
    // Setup
    const regex = "(a|b)*abb";
    const tree = buildAhoTree(regex);
    // SUT
    updateFollowPos(tree);
    // Log
    const leafNodes = getLeafNodes(tree);
    // console.log(inspect(leafNodes, { depth: null, colors: true }));
});

test("[testRegexConversion] Test Working", () => {
    // Setup
    const regexstr = "(a|b)*abb";
    const regex = fromDBEntry({
        id: "test",
        name: "test",
        definitions: {},
        type: ExpressionType.REGULAR,
        expression: regexstr,
    });
    // SUT
    const machine = convertRegularExpressionToNonDeterministicFiniteMachine(
        regex
    );
    // Log
    // console.log(inspect(machine.toJS(), { depth: null, colors: true }));
});
