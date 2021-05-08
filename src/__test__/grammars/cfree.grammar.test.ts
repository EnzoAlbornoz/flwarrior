import Immutable from "immutable";
import { GrammarType } from "@/database/schema/grammar";
import {
    directFatorization,
    factorize,
    firstDerivatedBodies,
    fromDBEntry,
    generateNonTerminalSymbols,
    getRuleBodiesGroupedByPrefix,
    IGrammar,
    IGrammarWord,
    indirectFactorization,
} from "@/lib/grammar/Grammar";
import { test } from "@jest/globals";
import { inspect } from "util";
import { identifyCommomPrefix } from "@/lib/utils";

const grammar1 = fromDBEntry({
    id: "test1",
    name: "test1",
    alphabetNT: ["S", "A", "B", "C"],
    alphabetT: ["a", "b", "c"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: [
                ["a", "B", "C"],
                ["a", "A", "C"],
                ["b", "B"],
            ],
        },
        {
            from: ["A"],
            to: [["a", "B"]],
        },
        {
            from: ["B"],
            to: [["a", "B"], ["b"]],
        },
        {
            from: ["C"],
            to: [["c"]],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarCannonical = fromDBEntry({
    id: "test2",
    name: "test2",
    alphabetNT: ["S", "A", "B", "C", "D"],
    alphabetT: ["a", "c", "d", "e", "f"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["AC".split(""), "BC".split("")],
        },
        {
            from: ["A"],
            to: ["aD".split(""), "cC".split("")],
        },
        {
            from: ["B"],
            to: ["aB".split(""), "dD".split("")],
        },
        {
            from: ["C"],
            to: ["eC".split(""), "eA".split("")],
        },
        {
            from: ["D"],
            to: ["fD".split(""), "CB".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarCannonicalFactorized = fromDBEntry({
    id: "test2",
    name: "test2",
    alphabetNT: ["S", "A", "B", "C", "D", "E", "F"],
    alphabetT: ["a", "c", "d", "e", "f"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["aE".split(""), "cCC".split(""), "dDC".split("")],
        },
        {
            from: ["A"],
            to: ["aD".split(""), "cC".split("")],
        },
        {
            from: ["B"],
            to: ["aB".split(""), "dD".split("")],
        },
        {
            from: ["C"],
            to: ["eF".split("")],
        },
        {
            from: ["D"],
            to: ["fD".split(""), "CB".split("")],
        },
        {
            from: ["E"],
            to: ["DC".split(""), "BC".split("")],
        },
        {
            from: ["F"],
            to: ["C".split(""), "A".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

test("factoring", () => {
    const dateInit = Date.now();
    const factorizedGrammar = factorize(grammarCannonical);
    const dateEnd = Date.now();
    console.log(dateEnd - dateInit);
    // expect(factorizedGrammar).toEqual(grammarCannonicalFactorized);
});
