import { getUnicodeLettersUpper } from "@/utils/unicode";
import Immutable from "immutable";
import { GrammarType, GrammarDBEntry } from "../../database/schema/grammar";
import { IAlphabet } from "../Alphabet";
import { ASymbol, EPSILON } from "../AlphabetSymbol";
import { identifyCommomPrefix } from "../utils";

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

export function* generateNonTerminalSymbols(
    inUseSymbols: Array<string> = []
): Generator<string> {
    const symbols = getUnicodeLettersUpper(inUseSymbols);
    for (const symbol of symbols) {
        yield symbol;
    }
}

export function* generateNewSymbol(): Generator<string> {
    const symbolsList = "δ,θ,λ,ξ,σ,ψ,ω,я,ц,ж,д,ы,и,п,ь,л,б,ш,ю,ч,ф"
        .toUpperCase()
        .split(",");
    yield symbolsList[0];
    let i = 0;
    while (true) {
        i++;
        yield symbolsList[i];
    }
}

export const removeDirectLeftProduction = (
    grammar: IIGrammar,
    headToRemove = "stop"
): IIGrammar => {
    let productionRules = grammar.get("productionRules") as Immutable.Map<
        IGrammarWord,
        Immutable.Set<IGrammarWord>
    >;
    // if head is set, then look for only that head
    if (headToRemove !== "stop") {
        productionRules = (grammar.get("productionRules") as Immutable.Map<
            IGrammarWord,
            Immutable.Set<IGrammarWord>
        >).filter((_, head) => head.join("") === headToRemove);
    }
    const generator = generateNewSymbol();
    let clonedGrammar = grammar;
    // first find left recursive productions
    let leftRecursiveHeads = Immutable.Set<IGrammarWord>();
    let leftRecursiveHeadsToBody = Immutable.Map<
        IGrammarWord,
        Immutable.Set<IGrammarWord>
    >();
    for (const [head, productionSet] of productionRules) {
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

                if (!leftRecursiveHeadsToBody.has(head)) {
                    leftRecursiveHeadsToBody = leftRecursiveHeadsToBody.set(
                        head,
                        Immutable.Set<IGrammarWord>()
                    );
                }
                leftRecursiveHeadsToBody = leftRecursiveHeadsToBody.update(
                    head,
                    (setu) => (setu as Immutable.Set<IGrammarWord>).add(body)
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
        for (const production of oldBody) {
            // remove the original left recursion from each body
            // and add a new production which is equal
            // except this production has the new symbol appended at the end
            const newProduction = production.push(newHead).shift();
            clonedGrammar = addProductionBody(
                clonedGrammar,
                [newHead],
                newProduction.toArray()
            );
        }
        // finally add ε to the production list
        clonedGrammar = addProductionBody(clonedGrammar, [newHead], [EPSILON]);
        clonedGrammar = addTerminalSymbol(clonedGrammar, EPSILON);
    }
    return clonedGrammar;
};

// Only works on grammars which don't have circular productions & without ε
export const removeLeftProduction = (grammar: IIGrammar): IIGrammar => {
    const findProductionAiAj = (
        clonedGrammar: IIGrammar,
        ai: string,
        aj: string
    ): Immutable.Set<[IGrammarWord, IGrammarWord]> => {
        let productions = Immutable.Set();
        for (const production of (clonedGrammar.get(
            "productionRules"
        ) as Immutable.Map<
            IGrammarWord,
            Immutable.Set<IGrammarWord>
        >).entrySeq()) {
            if (production[0].first() === ai) {
                for (const body of production[1]) {
                    if (body.first() === aj)
                        productions = productions.add([production[0], body]);
                }
            }
        }
        return productions;
    };
    // return grammar
    let clonedGrammar = grammar;
    // Following teachers algorithm
    // first we should place the non-terminal symbols in some order
    const nonTermianlSymbolsList = (grammar.get(
        "nonTerminalSymbols"
    ) as IAlphabet).toList();
    // we eliminate the indirect recursion first
    // eslint-disable-next-line no-empty
    for (let i = 0; i < nonTermianlSymbolsList.size; i++) {
        for (let j = 0; j < i; j++) {
            // if Ai -> Aja is in P
            // find a production that takes from Ai to Aj
            const productionsAiAj = findProductionAiAj(
                clonedGrammar,
                nonTermianlSymbolsList.get(i),
                nonTermianlSymbolsList.get(j)
            );
            // should be only 1
            if (productionsAiAj.size > 1) {
                console.error(
                    "should be only one, this should be dealt with now"
                );
            }

            if (productionsAiAj.size === 1) {
                // remove the production Ai -> Aj
                clonedGrammar = removeProductionBody(
                    clonedGrammar,
                    (productionsAiAj.first() as [
                        IGrammarWord,
                        IGrammarWord
                    ])[0].toArray(),
                    (productionsAiAj.first() as [
                        IGrammarWord,
                        IGrammarWord
                    ])[1].toArray()
                );
                if (
                    (productionsAiAj.first() as [IGrammarWord, IGrammarWord])[1]
                        .size === 1
                ) {
                    // one single symbol, we can just append all the productions directly

                    for (const body of getBodiesOfHead(clonedGrammar, [
                        nonTermianlSymbolsList.get(j),
                    ])) {
                        // append them to the Ai
                        clonedGrammar = addProductionBody(
                            clonedGrammar,
                            (productionsAiAj.first() as [
                                IGrammarWord,
                                IGrammarWord
                            ])[0].toArray(),
                            body.toArray()
                        );
                    }
                } else {
                    // more than one symbol, must shift
                    const bodyToAppend = (productionsAiAj.first() as [
                        IGrammarWord,
                        IGrammarWord
                    ])[1].shift();

                    // for every production Aj -> B in P, add these productions
                    // to the bodies that contain the symbol Ai -> Ba
                    // S -> Aa | b
                    // A -> Ac | Sd | a
                    //           ^ so far we removed this
                    // becomes
                    // A -> Ac | Aad | bd | a
                    for (const body of getBodiesOfHead(clonedGrammar, [
                        nonTermianlSymbolsList.get(j),
                    ])) {
                        // append them to Ai
                        clonedGrammar = addProductionBody(
                            clonedGrammar,
                            (productionsAiAj.first() as [
                                IGrammarWord,
                                IGrammarWord
                            ])[0].toArray(),
                            body.push(...bodyToAppend.toArray()).toArray()
                        );
                    }
                }
            }
        }
        // eliminate direct recursions
        clonedGrammar = removeDirectLeftProduction(
            clonedGrammar,
            nonTermianlSymbolsList.get(i)
        );
    }
    return clonedGrammar;
};

export const getRuleBodiesGroupedByPrefix = (
    bodies: Immutable.Set<IGrammarWord>
): Immutable.Set<Immutable.Set<IGrammarWord>> => {
    // Create Body Groups
    let workingList = bodies;
    let bodyGroups = Immutable.Set<Immutable.Set<IGrammarWord>>();
    while (!workingList.isEmpty()) {
        // Mark Iteriation
        const currentIteration = workingList.first<IGrammarWord>();
        workingList = workingList.remove(currentIteration);
        // Define Body Group
        let bodyGroup = Immutable.Set([currentIteration]);
        // Iterate Over the Rest of the Working List
        for (const body of workingList) {
            const commonPrefix = identifyCommomPrefix(
                currentIteration.join(""),
                body.join("")
            );
            if (commonPrefix) {
                // Remove from list and add it to the group
                workingList = workingList.remove(body);
                bodyGroup = bodyGroup.add(body);
            }
        }
        // Merge with Body Groups
        bodyGroups = bodyGroups.add(bodyGroup);
    }
    return bodyGroups;
};

export const directFatorization = (grammar: IIGrammar) => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    // Create Non Terminal Generator
    const ntGen = generateNonTerminalSymbols(
        (grammar.get(
            "nonTerminalSymbols"
        ) as IGrammar["nonTerminalSymbols"]).toArray()
    );
    // Iterate over productions
    for (const rule of grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"]) {
        // Destructure production
        const [head, bodies] = rule;
        const bodyGroups = getRuleBodiesGroupedByPrefix(bodies);
        // Body Groups Done
        for (const group of bodyGroups) {
            // Common Prefix -> Need Factorization
            if (group.size > 1) {
                // Get Common Prefix
                const commonPrefix = identifyCommomPrefix(
                    ...group.map((word) => word.join("")).toArray()
                );
                const prefixSize = commonPrefix.length;
                // Generate Custom Non Terminal
                const newNonTerminal: string = ntGen.next().value;
                // Map Group Elements and Remove from Grammar too
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                const mappedGroup = group.map((word) => {
                    // Remove Word from Grammar
                    transGrammar = transGrammar?.updateIn(
                        ["productionRules", head],
                        (bodiesOld: Immutable.Set<IGrammarWord>) =>
                            bodiesOld.remove(word)
                    );
                    // Remove Prefix from Word
                    return word.slice(prefixSize);
                });
                // Add New Symbol to Grammar
                transGrammar = transGrammar
                    .updateIn(
                        ["productionRules", head],
                        (bodiesOld: Immutable.Set<IGrammarWord>) =>
                            bodiesOld.add(
                                Immutable.List([
                                    ...commonPrefix.split(""),
                                    newNonTerminal,
                                ])
                            )
                    )
                    .update(
                        "productionRules",
                        (productions: IGrammar["productionRules"]) =>
                            productions.set(
                                Immutable.List([newNonTerminal]),
                                Immutable.Set(mappedGroup)
                            )
                    )
                    .update(
                        "nonTerminalSymbols",
                        (symbols: IGrammar["nonTerminalSymbols"]) =>
                            symbols.add(newNonTerminal)
                    );
            }
        }
    }
    // Return Transformed Grammar
    return transGrammar;
};

export const firstDerivatedBodies = (
    word: IGrammarWord,
    grammar: IIGrammar
): Immutable.Set<IGrammarWord> => {
    // Define Derivated Bodies
    const charToCheck = word.get(0);
    // Check Leaf
    if (
        (grammar.get(
            "terminalSymbols"
        ) as IGrammar["terminalSymbols"]).includes(charToCheck)
    ) {
        return Immutable.Set(charToCheck === EPSILON ? [] : [word]);
    }
    // Need to derivate the word
    const shiftedWord = word.shift();
    const resultingWords = (grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"])
        .get(Immutable.List(charToCheck))
        .flatMap((toDerivateWord) => {
            // Derivate Word
            const derivatedWords = firstDerivatedBodies(
                toDerivateWord,
                grammar
            );
            // Join With the Shifted Word
            return derivatedWords.map((derivatedWord) =>
                derivatedWord.concat(shiftedWord)
            );
        });
    // Return Resultin Words
    return resultingWords;
};

export const indirectFactorization = (grammar: IIGrammar): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    // Iterate over productions
    for (const rule of grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"]) {
        // Destructure production
        const [head, bodies] = rule;
        // Create a Factorization Map
        let factorMap = Immutable.Map<
            IGrammarWord,
            Immutable.Set<IGrammarWord>
        >();
        // Populate the Map
        for (const body of bodies) {
            // Derivate
            const derivatedBodies = firstDerivatedBodies(body, grammar);
            // Add to Factor Map
            factorMap = factorMap.set(body, derivatedBodies);
        }
        // Check if Exists Indirect Non Determinism
        const groups = getRuleBodiesGroupedByPrefix(
            factorMap.toList().flatten(1).toSet()
        );
        const indirectDeterminismGroups = groups.filter(
            (group) => group.size > 1
        );
        // Modify Grammar if has Indirect Non Determinism
        if (indirectDeterminismGroups.size) {
            for (const group of indirectDeterminismGroups) {
                // Filter original bodies that reach this group
                const bodiesThatReach = factorMap.filter(
                    (derivable) => derivable.intersect(group).size
                );
                // Change the Original Body by their Derivable Bodies
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                bodiesThatReach.forEach((derivable, body) => {
                    transGrammar = transGrammar.updateIn(
                        ["productionRules", head],
                        (transBodies: Immutable.Set<IGrammarWord>) =>
                            transBodies.remove(body).union(derivable)
                    );
                });
            }
        }
    }
    // Return Transformed Grammar
    return directFatorization(transGrammar);
};

export const factorize = (grammar: IIGrammar, maxIterations = 5): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    for (let iterations = 0; iterations < maxIterations; iterations++) {
        transGrammar = indirectFactorization(directFatorization(transGrammar));
    }
    // Return the Transformed Grammar
    return transGrammar;
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
