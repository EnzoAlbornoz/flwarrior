import Immutable from "immutable";
import { GrammarType, GrammarDBEntry } from "../../database/schema/grammar";
import { IAlphabet } from "../Alphabet";
import { ASymbol, EPSILON } from "../AlphabetSymbol";

// Immutability Port
export type IGrammarWord = Immutable.List<ASymbol>;
interface IGrammar {
    id: string;
    name: string;
    type: GrammarType;
    startSymbol: ASymbol;
    terminalSymbols: IAlphabet;
    nonTerminalSymbols: IAlphabet;
    productionRules: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>;
}
export type IIGrammar = Immutable.Map<keyof IGrammar, IGrammar[keyof IGrammar]>;

export const fromDBEntry = (dbEntry: GrammarDBEntry): IIGrammar =>
    Immutable.Map<IGrammar[keyof IGrammar]>({
        id: dbEntry.id,
        name: dbEntry.name,
        type: dbEntry.type,
        startSymbol: dbEntry.startSymbol,
        terminalSymbols: Immutable.OrderedSet(dbEntry.alphabetT),
        nonTerminalSymbols: Immutable.OrderedSet(dbEntry.alphabetNT),
        productionRules: dbEntry.transitions.reduce((m, c) => {
            const head = Immutable.List(c.from);
            const body = Immutable.Set(
                c.to.map((prod) => Immutable.List(prod))
            );
            m.set(head, m.get(head, Immutable.Set<IGrammarWord>()).merge(body));
            return m;
        }, Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>()),
    }) as IIGrammar;

export const toDBEntry = (grammar: IIGrammar): GrammarDBEntry => {
    interface IntermediateEntry extends GrammarDBEntry {
        productionRules: Record<string, Array<Array<string>>>;
    }
    const intermediate = grammar.toJS() as IntermediateEntry;
    return {
        ...intermediate,
        productionRules: Object.entries(
            intermediate.productionRules
        ).map(([from, to]) => ({ from, to })),
    } as GrammarDBEntry;
};

export const addNonTerminalSymbol = (
    grammar: IIGrammar,
    symbol: ASymbol
): IIGrammar =>
    grammar.update(
        "nonTerminalSymbols",
        Immutable.OrderedSet<ASymbol>(),
        (old: Immutable.OrderedSet<ASymbol>) => old.union([symbol])
    );

export const addTerminalSymbol = (
    grammar: IIGrammar,
    symbol: ASymbol
): IIGrammar =>
    grammar.update(
        "terminalSymbols",
        Immutable.OrderedSet<ASymbol>(),
        (old: Immutable.OrderedSet<ASymbol>) => old.union([symbol])
    );

export const removeTerminalSymbol = (
    grammar: IIGrammar,
    terminalSymbol: ASymbol
): IIGrammar =>
    grammar.update(
        "terminalSymbols",
        Immutable.OrderedSet<ASymbol>(),
        (old: Immutable.OrderedSet<ASymbol>) => old.remove(terminalSymbol)
    );

export const removeNonTerminalSymbol = (
    grammar: IIGrammar,
    nonTerminalSymbol: ASymbol
): IIGrammar =>
    grammar.update(
        "nonTerminalSymbols",
        Immutable.OrderedSet<ASymbol>(),
        (old: Immutable.OrderedSet<ASymbol>) => old.remove(nonTerminalSymbol)
    );

export const addProductionHead = (
    grammar: IIGrammar,
    from: Array<string>
): IIGrammar =>
    grammar.update(
        "productionRules",
        Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>(),
        (rules: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) =>
            rules.has(Immutable.List(from))
                ? rules
                : rules.set(Immutable.List(from), Immutable.Set())
    );

export const addProductionBody = (
    grammar: IIGrammar,
    from: Array<string>,
    to: Array<string>
): IIGrammar =>
    grammar.updateIn(
        ["productionRules", Immutable.List(from)],
        Immutable.Set<IGrammarWord>(),
        (old: Immutable.Set<IGrammarWord>) =>
            old.has(Immutable.List(to)) ? old : old.add(Immutable.List(to))
    );

export const removeProductionHead = (
    grammar: IIGrammar,
    from: Array<string>
): IIGrammar =>
    grammar.update(
        "productionRules",
        (old: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) =>
            old.remove(Immutable.List(from))
    );

export const removeProductionBody = (
    grammar: IIGrammar,
    from: Array<string>,
    body: Array<string>
): IIGrammar =>
    grammar.updateIn(
        ["productionRules", Immutable.List(from)],
        (old: Immutable.Set<IGrammarWord>) => old.remove(Immutable.List(body))
    );

export const checkOwnType = (grammar: IIGrammar): GrammarType => {
    // Check for type Context Sensitive (No recursive empty)
    if (
        !(grammar.get("productionRules") as IGrammar["productionRules"]).every(
            (body, head, rules) =>
                // Length check of production rules
                body
                    .filterNot((w) => w.includes(EPSILON))
                    .every((word) => word.size >= head.size) && // Epsilon does not occurs on body
                (body.some((word) => word.includes(EPSILON)) || // Not referencied in any body
                    (rules.every((rb) =>
                        rb.every(
                            (rbw) =>
                                !rbw.every(
                                    (char, key) => char === head.get(key)
                                )
                        )
                    ) &&
                        // Is initial state
                        head.equals(grammar.get("startSymbol"))))
        )
    ) {
        return GrammarType.UNRESTRICTED;
    }
    // Check for type Context Free (Head with length === 1)
    if (
        !(grammar.get("productionRules") as IGrammar["productionRules"]).every(
            (_, head) => head.size === 1
        )
    ) {
        return GrammarType.CONTEXT_SENSITIVE;
    }
    // Check for type Finite State
    if (
        !(grammar.get(
            "productionRules"
        ) as IGrammar["productionRules"]).every((body) =>
            body.every(
                (pb) =>
                    [1, 2].includes(pb.size) &&
                    (grammar.get(
                        "terminalSymbols"
                    ) as IGrammar["terminalSymbols"]).includes(pb.get(0)) &&
                    (pb.size === 1 ||
                        (grammar.get(
                            "terminalSymbols"
                        ) as IGrammar["terminalSymbols"]).includes(pb.get(1)))
            )
        )
    ) {
        return GrammarType.CONTEXT_FREE;
    }
    return GrammarType.REGULAR;
};
