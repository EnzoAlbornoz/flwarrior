import Immutable, { remove } from "immutable";
import { stringify } from "uuid";
import { GrammarType, GrammarDBEntry } from "../../database/schema/grammar";
import { IAlphabet } from "../Alphabet";
import { ASymbol, EPSILON } from "../AlphabetSymbol";

// Immutability Port
export type IGrammarWord = Immutable.List<ASymbol>;
export interface IGrammar {
    id: string;
    name: string;
    type: GrammarType;
    startSymbol: ASymbol;
    terminalSymbols: IAlphabet;
    nonTerminalSymbols: IAlphabet;
    productionRules: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>;
}
export type IIGrammar = Immutable.Map<keyof IGrammar, IGrammar[keyof IGrammar]>;

export const rename = (grammar: IIGrammar, newName: string): IIGrammar =>
    grammar.update("name", () => newName);

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
    head: Array<ASymbol>
): IIGrammar =>
    grammar.update(
        "productionRules",
        Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>(),
        (rules: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) =>
            rules.has(Immutable.List(head))
                ? rules
                : rules.set(Immutable.List(head), Immutable.Set())
    );

export const addProductionBody = (
    grammar: IIGrammar,
    head: Array<ASymbol>,
    body: Array<ASymbol>
): IIGrammar =>
    grammar.updateIn(
        ["productionRules", Immutable.List(head)],
        Immutable.Set<IGrammarWord>(),
        (old: Immutable.Set<IGrammarWord>) =>
            old.has(Immutable.List(body)) ? old : old.add(Immutable.List(body))
    );

export const removeProductionHead = (
    grammar: IIGrammar,
    head: Array<ASymbol>
): IIGrammar =>
    grammar.update(
        "productionRules",
        (old: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) =>
            old.remove(Immutable.List(head))
    );

export const removeProductionBody = (
    grammar: IIGrammar,
    head: Array<ASymbol>,
    body: Array<ASymbol>
): IIGrammar =>
    grammar.updateIn(
        ["productionRules", Immutable.List(head)],
        (old: Immutable.Set<IGrammarWord>) => old.remove(Immutable.List(body))
    );

export const getBodiesOfHead = (
    grammar: IIGrammar,
    head: Array<ASymbol>
): Immutable.Set<IGrammarWord> =>
    (grammar.get("productionRules") as Immutable.Map<
        IGrammarWord,
        Immutable.Set<IGrammarWord>
    >)
        .filter((_, key) => {
            return key.toArray().join() === head.join();
        })
        .valueSeq()
        .first() as Immutable.Set<IGrammarWord>;

export const setStartSymbol = (
    grammar: IIGrammar,
    newStartSymbol: ASymbol
): IIGrammar => grammar.update("startSymbol", () => newStartSymbol);

export const checkOwnType = (grammar: IIGrammar): GrammarType => {
    // Check for type Context Sensitive (No recursive empty)
    if (
        !(grammar.get("productionRules") as IGrammar["productionRules"]).every(
            (bodies, head, rules) => {
                // Check if Initial States
                if (
                    head.join() ===
                    (grammar.get("startSymbol") as IGrammar["startSymbol"])
                ) {
                    // Check Initial State Rules
                    if (head.includes(EPSILON)) {
                        // Check Head is not target of any production
                        return rules.every(
                            (nestedBodies, nestedHead) =>
                                !nestedHead.equals(head) ||
                                nestedBodies.every((nestedBody) =>
                                    nestedBody.join().includes(head.join())
                                )
                        );
                    }
                    // Only Check Size
                    return bodies.every(
                        (body) =>
                            head.size <= body.size && !body.includes(EPSILON)
                    );
                }
                // Check Normal Body
                return bodies.every(
                    (body) => head.size <= body.size && !body.includes(EPSILON)
                );
            }
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
                            "nonTerminalSymbols"
                        ) as IGrammar["nonTerminalSymbols"]).includes(
                            pb.get(1)
                        ))
            )
        )
    ) {
        return GrammarType.CONTEXT_FREE;
    }
    return GrammarType.REGULAR;
};

export function* generateNewSymbol(): Generator<string> {
    const symbolsList = "δ, θ, λ, ξ, σ, ψ, ω, я, ц, ж, д, ы, и, п, ь, л, б, ш, ю, ч, ф"
        .toUpperCase()
        .split(",");
    yield symbolsList[0];
    let i = 0;
    while (true) {
        i++;
        yield symbolsList[i];
    }
}

export const removeDirectLeftProduction = (grammar: IIGrammar): IIGrammar => {
    const generator = generateNewSymbol();
    let clonedGrammar = grammar;
    // first find left recursive productions
    let leftRecursiveHeads = Immutable.Set<IGrammarWord>();
    let leftRecursiveHeadsToBody = Immutable.Map<IGrammarWord, IGrammarWord>();
    for (const [head, productionSet] of grammar.get(
        "productionRules"
    ) as Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) {
        for (const body of productionSet) {
            if ((head as IGrammarWord).size > 1)
                console.error(
                    "Head with more than 1 symbol, May be Unrestricted grammar"
                );
            if (
                (head as IGrammarWord).first() ===
                (body as IGrammarWord).first()
            ) {
                // if not already added
                // add production to map for later
                leftRecursiveHeads = leftRecursiveHeads.add(head);
                leftRecursiveHeadsToBody = leftRecursiveHeadsToBody.set(
                    head,
                    body
                );
                // remove this production
                clonedGrammar = removeProductionBody(
                    clonedGrammar,
                    (head as IGrammarWord).toArray(),
                    (body as IGrammarWord).toArray()
                );
            }
        }
    }
    // for every production head in the map
    // create a new symbol and
    // append it to the end of all the productions with this head
    let headToNewHead = Immutable.Map<IGrammarWord, string>();
    for (const head of leftRecursiveHeads) {
        // create a new symbol
        let next = generator.next();
        while (
            (clonedGrammar.get("nonTerminalSymbols") as IAlphabet).contains(
                next.value
            )
        ) {
            next = generator.next();
        }
        // add new symbol to the non terminal list
        clonedGrammar = addNonTerminalSymbol(clonedGrammar, next.value);
        // save for later
        headToNewHead = headToNewHead.set(head, next.value);
        // get the body of this head
        for (const body of getBodiesOfHead(clonedGrammar, head.toArray())) {
            // remove the old production
            clonedGrammar = removeProductionBody(
                clonedGrammar,
                head.toArray(),
                body.toArray()
            );
            // append the new symbol
            clonedGrammar = addProductionBody(
                clonedGrammar,
                head.toArray(),
                body.push(next.value).toArray()
            );
        }
    }

    for (const [oldHead, oldBody] of leftRecursiveHeadsToBody) {
        // get the new head
        const newHead = headToNewHead.get(oldHead);

        // create new productions with the new head
        clonedGrammar = addProductionHead(clonedGrammar, [newHead]);

        // remove the original left recursion from each body
        // and add a new production which is equal
        // except this production has the new symbol appended at the end
        const newProduction = oldBody.push(newHead).shift();
        clonedGrammar = addProductionBody(
            clonedGrammar,
            [newHead],
            newProduction.toArray()
        );
        // finally add ε to the production list
        clonedGrammar = addProductionBody(clonedGrammar, [newHead], [EPSILON]);
    }

    // console.log(leftRecursiveHeads.toJS());
    // for each of these productions we
    return clonedGrammar;
};

export const removeLeftProduction = (grammar: IIGrammar): IIGrammar => {
    // Following teachers algorithm
    // first we should place the non-terminal symbols in some order
    const nonTermianlSymbolsList = (grammar.get(
        "nonTerminalSymbols"
    ) as IAlphabet).toList();
    // we eliminate the indirect recursion first
    // eslint-disable-next-line no-empty
    for (const iterator of nonTermianlSymbolsList) {
    }
    return grammar;
};

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
            return m.set(
                head,
                m.get(head, Immutable.Set<IGrammarWord>()).merge(body)
            );
        }, Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>()),
    }) as IIGrammar;

export const toDBEntry = (grammar: IIGrammar): GrammarDBEntry => {
    // Fetch Type of Grammar
    const grammarType = checkOwnType(grammar);

    return {
        id: grammar.get("id") as string,
        name: grammar.get("name") as string,
        type: grammarType,
        startSymbol: grammar.get("startSymbol") as string,
        alphabetT: (grammar.get(
            "terminalSymbols"
        ) as IGrammar["terminalSymbols"]).toArray(),
        alphabetNT: (grammar.get(
            "nonTerminalSymbols"
        ) as IGrammar["nonTerminalSymbols"]).toArray(),
        transitions: (grammar.get(
            "productionRules"
        ) as IGrammar["productionRules"])
            .entrySeq()
            .map(([head, bodies]) => ({ from: head, to: bodies }))
            .toJS() as GrammarDBEntry["transitions"],
    } as GrammarDBEntry;
};
