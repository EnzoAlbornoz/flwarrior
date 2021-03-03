import { GrammarType, GrammarDBEntry } from "@database/schema/grammar";
import Alphabet from "../Alphabet";
import AlphabetSymbol from "../AlphabetSymbol";
import { Tuple, arrayCompare } from "../utils";
import {} from "buckets-js";

interface IGrammar {
    id: string;
    nonTerminalSymbols: Alphabet;
    terminalSymbols: Alphabet;
    productionRules: Array<
        Tuple<Array<AlphabetSymbol>, Set<Array<AlphabetSymbol>>>
    >;
    startSymbol: AlphabetSymbol;
    type: GrammarType;
    name: string;
    addProduction: (
        from: Array<AlphabetSymbol>,
        to: Set<Array<AlphabetSymbol>>
    ) => void;
    removeProduction: (
        from: Array<AlphabetSymbol>,
        to: Set<Array<AlphabetSymbol>>
    ) => void;
    toString: () => string;
    fromDBEntry: (grammar: GrammarDBEntry) => void;
    checkOwnType: () => GrammarType;
}

class Grammar implements IGrammar {
    checkOwnType(): GrammarType {
        // Check for type Context Sensitive (No recursive empty)
        if (
            !this.productionRules.every(
                ([head, body]) =>
                    Array.from(body).every(
                        (b) =>
                            head.filter(
                                (c) => !c.equals(AlphabetSymbol.EPSILON)
                            ).length <= b.length
                    ) &&
                    head.length === 1 &&
                    !this.startSymbol.equals(head[0])
            )
        ) {
            return GrammarType.UNRESTRICTED;
        }
        // Check for type Context Free (Head with length === 1)
        if (!this.productionRules.every(([head]) => head.length === 1)) {
            return GrammarType.CONTEXT_SENSITIVE;
        }
        // Check for type Finite State
        if (
            !this.productionRules.every(([_, body]) =>
                Array.from(body).every(
                    (pb) =>
                        [1, 2].includes(pb.length) &&
                        Array.from(this.terminalSymbols.symbols).some((s) =>
                            s.equals(pb[0])
                        ) &&
                        (pb.length === 1 ||
                            Array.from(this.terminalSymbols.symbols).some((s) =>
                                s.equals(pb[0])
                            ))
                )
            )
        ) {
            return GrammarType.CONTEXT_FREE;
        }
        return GrammarType.REGULAR;
    }

    addNonTerminalSymbol(nonTerminalSymbol: AlphabetSymbol): void {
        this.nonTerminalSymbols.symbols.add(nonTerminalSymbol);
    }

    addTerminalSymbol(terminalSymbol: AlphabetSymbol): void {
        this.terminalSymbols.symbols.add(terminalSymbol);
    }

    removeTerminalSymbol(terminalSymbol: AlphabetSymbol): void {
        this.terminalSymbols.symbols.delete(terminalSymbol);
    }

    removeNonTerminalSymbol(nonTerminalSymbol: AlphabetSymbol): void {
        this.nonTerminalSymbols.symbols.delete(nonTerminalSymbol);
    }

    addProductionHead(from: AlphabetSymbol[]): void {
        const grammarHeadIdx = this.productionRules.findIndex(([rulehead]) => {
            return (
                from.map((aSymbol) => aSymbol.symbol).join() ===
                rulehead.map((aSymbol) => aSymbol.symbol).join()
            );
        });
        if (grammarHeadIdx === -1) {
            this.productionRules.push([from, new Set()]);
        }
    }

    removeProductionHead(from: AlphabetSymbol[]): void {
        const grammarHeadIdx = this.productionRules.findIndex(([rulehead]) => {
            return (
                from.map((aSymbol) => aSymbol.symbol).join() ===
                rulehead.map((aSymbol) => aSymbol.symbol).join()
            );
        });
        if (grammarHeadIdx === -1) {
            throw new Error("no such head found on productionRules");
        }
        const deleted = this.productionRules.splice(grammarHeadIdx, 1);
        console.log(deleted);
    }

    removeProductionBody(
        productionHead: AlphabetSymbol[],
        to: AlphabetSymbol[]
    ): void {
        const grammarHeadIdx = this.productionRules.findIndex(([rulehead]) => {
            return (
                productionHead.map((aSymbol) => aSymbol.symbol).join() ===
                rulehead.map((aSymbol) => aSymbol.symbol).join()
            );
        });
        if (grammarHeadIdx === -1) {
            throw new Error("no such head found on productionRules");
        }
        this.productionRules[grammarHeadIdx][1].forEach((array) => {
            if (
                array.map((aSymbol) => aSymbol.symbol).join() ===
                to.map((aSymbol) => aSymbol.symbol).join()
            )
                this.productionRules[grammarHeadIdx][1].delete(array);
        });
    }

    addProductionBody(
        productionHead: AlphabetSymbol[],
        to: Set<AlphabetSymbol[]>
    ): void {
        const grammarHeadIdx = this.productionRules.findIndex(([rulehead]) => {
            return (
                productionHead.map((aSymbol) => aSymbol.symbol).join() ===
                rulehead.map((aSymbol) => aSymbol.symbol).join()
            );
        });
        if (grammarHeadIdx === -1) {
            throw new Error("no such head found on productionRules");
        }
        to.forEach((symbols) =>
            this.productionRules[grammarHeadIdx][1].add(symbols)
        );
    }

    addProduction(from: AlphabetSymbol[], to: Set<AlphabetSymbol[]>): void {
        let outerIndex = -1;
        for (const [
            innerIndex,
            alpSymTuples,
        ] of this.productionRules.entries()) {
            const isArrayInLeftSideProduction = arrayCompare(
                (left: AlphabetSymbol, right: AlphabetSymbol) =>
                    left.equals(right),
                alpSymTuples[0],
                from
            );
            if (isArrayInLeftSideProduction) {
                outerIndex = innerIndex;
                for (const toList of to) {
                    let isArrayInRightSideProduction = false;
                    for (const list of alpSymTuples[1]) {
                        isArrayInRightSideProduction = arrayCompare(
                            (left: AlphabetSymbol, right: AlphabetSymbol) =>
                                left.equals(right),
                            list,
                            toList
                        );
                        if (isArrayInRightSideProduction) return;
                    }
                }
            }
        }
        if (outerIndex !== -1) {
            // new right side production
            to.forEach((array) => {
                this.productionRules[outerIndex][1].add(array);
            });
        } else {
            // new left and right productions
            this.productionRules.push([from, to]);
        }
    }

    removeProduction: (
        from: AlphabetSymbol[],
        to: Set<AlphabetSymbol[]>
    ) => void;

    name: string;

    id: string;

    type: GrammarType;

    nonTerminalSymbols: Alphabet;

    terminalSymbols: Alphabet;

    productionRules: Array<
        Tuple<Array<AlphabetSymbol>, Set<Array<AlphabetSymbol>>>
    >;

    startSymbol: AlphabetSymbol;

    toString(): string {
        const x: GrammarDBEntry = {
            id: this.id,
            name: this.name,
            type: this.type,
            startSymbol: this.startSymbol.toString(),
            alphabetNT: Array.from(
                this.nonTerminalSymbols.symbols.values()
            ).map((alphabetSymbol) => alphabetSymbol.toString()),
            alphabetT: Array.from(
                this.terminalSymbols.symbols.values()
            ).map((alphabetSymbol) => alphabetSymbol.toString()),
            transitions: this.productionRules.map(([leftSymbols, right]) => {
                return {
                    from: leftSymbols.map((alphabetSymbol) =>
                        alphabetSymbol.toString()
                    ),
                    to: Array.from(right.values()).map((symbolsCluster) =>
                        symbolsCluster.map((symbol) => symbol.toString())
                    ),
                };
            }),
        };
        return JSON.stringify(x);
    }

    fromDBEntry(grammar: GrammarDBEntry) {
        this.id = grammar.id;
        this.name = grammar.name;
        this.type = grammar.type;
        this.startSymbol = new AlphabetSymbol(grammar.startSymbol);
        this.nonTerminalSymbols = new Alphabet(
            new Set(
                grammar.alphabetNT.map((_string) => {
                    return new AlphabetSymbol(_string);
                })
            )
        );
        this.terminalSymbols = new Alphabet(
            new Set(
                grammar.alphabetT.map((_string) => {
                    return new AlphabetSymbol(_string);
                })
            )
        );
        this.productionRules = grammar.transitions.map((transition) => {
            return [
                transition.from.map((_string) => new AlphabetSymbol(_string)),
                new Set(
                    transition.to.map((altSymbolClusters) =>
                        altSymbolClusters.map(
                            (char) => new AlphabetSymbol(char)
                        )
                    )
                ),
            ];
        });
    }
}
