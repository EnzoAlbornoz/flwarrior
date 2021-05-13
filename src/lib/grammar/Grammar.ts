import { getUnicodeLettersUpper } from "@/utils/unicode";
import Immutable from "immutable";
import { GrammarType, GrammarDBEntry } from "../../database/schema/grammar";
import { IAlphabet } from "../Alphabet";
import { ASymbol, END_OF_STACK, EPSILON } from "../AlphabetSymbol";
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
): Generator<string, string, string> {
    const symbols = getUnicodeLettersUpper(inUseSymbols);
    for (const symbol of symbols) {
        yield symbol;
    }
    return "";
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

export const removeImproductiveSymbols = (grammar: IIGrammar): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    //  Get Grammar Productions
    const productions = grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const ntSymbols = grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"];
    // Define Productive Symbols set (SP)
    let productiveSymbols = (grammar.get(
        "terminalSymbols"
    ) as IGrammar["terminalSymbols"]).add(EPSILON);
    // Define Iteration
    const genQSet = (prodSymbols: IAlphabet) =>
        // X ∈ N
        ntSymbols.filter(
            (nonTerminalSymbol) =>
                // X ∉ SP
                !prodSymbols.includes(nonTerminalSymbol) &&
                // Exists at least one production X -> X1X2..XN that X1X2..X3 ∈ SP
                productions
                    // Production X -> X1X2..XN
                    .find((_, head) =>
                        head.equals(Immutable.List([nonTerminalSymbol]))
                    )
                    // X1X2..X3 ∈ SP
                    .some((production) =>
                        production.every((symbol) =>
                            prodSymbols.includes(symbol)
                        )
                    )
        );
    // Iterate
    let qSet = Immutable.OrderedSet();
    do {
        // Step 1  - Q = X ∈ N and X ∉ SP and exists at least one production X -> X1X2..XN that X1X2..X3 ∈ SP
        qSet = genQSet(productiveSymbols);
        // Step 2 - SP = SP ∪ Q
        productiveSymbols = productiveSymbols.union(qSet);
    } while (!qSet.isEmpty());
    // Filter Non Productive Symbols
    const productiveNTSymbols = ntSymbols.intersect(productiveSymbols);
    // Update Grammar
    transGrammar = transGrammar
        // Update Non Terminal Symbols
        .set("nonTerminalSymbols", productiveNTSymbols)
        // Update Productions
        .update("productionRules", (prodRules: IGrammar["productionRules"]) =>
            // If S ∈ SP then P = {p | p ∈ P and all symbols of p are in SP} else P = ∅
            productiveSymbols.includes(
                grammar.get("startSymbol") as IGrammar["startSymbol"]
            )
                ? // P = {p | p ∈ P and all symbols of p are in SP}
                  prodRules
                      .filter(
                          (_, head) =>
                              head.size === 1 &&
                              productiveNTSymbols.includes(head.get(0))
                      )
                      .map((bodies) =>
                          bodies.filter((body) =>
                              body.every((char) =>
                                  productiveSymbols.includes(char)
                              )
                          )
                      )
                : // P = ∅
                  Immutable.Map()
        );
    // Return Transformed Grammar
    return transGrammar;
};

export const removeUnreachableSymbols = (grammar: IIGrammar): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    //  Get Grammar Productions
    const productions = grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const ntSymbols = grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"];
    const tSymbols = grammar.get(
        "terminalSymbols"
    ) as IGrammar["terminalSymbols"];
    // Define Reachable Symbols set (SA)
    let reachableSymbols = Immutable.OrderedSet([
        grammar.get("startSymbol") as IGrammar["startSymbol"],
    ]);
    // Define Iteration
    const genMSet = (prodSymbols: IAlphabet) =>
        // X ∈ N
        ntSymbols.union(tSymbols).filter(
            (symbol) =>
                // X ∉ SA
                !prodSymbols.includes(symbol) &&
                // Exists at least one production Y -> αXβ that Y ∈ SA
                productions.some(
                    (bodies, head) =>
                        head.size === 1 &&
                        // Y ∈ SA
                        reachableSymbols.includes(head.get(0)) &&
                        bodies.some((body) =>
                            // Production Y -> αXβ
                            body.some((bodySymbol) => bodySymbol === symbol)
                        )
                )
        );
    // Iterate
    let mSet = Immutable.OrderedSet();
    do {
        // Step 1  - M = X ∈ N and X ∉ SA and exists at least one production Y -> αXβ that Y ∈ SA
        mSet = genMSet(reachableSymbols);
        // Step 2 - SA = SA ∪ M
        reachableSymbols = reachableSymbols.union(mSet);
    } while (!mSet.isEmpty());
    // Filter Non Productive Symbols
    const reachableNTSymbols = ntSymbols.intersect(reachableSymbols);
    const reachableTSymbols = tSymbols.intersect(reachableSymbols);
    // Update Grammar
    transGrammar = transGrammar
        // Update Non Terminal Symbols
        .set("nonTerminalSymbols", reachableNTSymbols)
        // Update Terminal Symbols
        .set("terminalSymbols", reachableTSymbols)
        // Update Productions
        .update("productionRules", (prodRules: IGrammar["productionRules"]) =>
            // P = {p | p ∈ P and all symbols of p are in SA}
            prodRules
                .filter(
                    (_, head) =>
                        head.size === 1 &&
                        reachableNTSymbols.includes(head.get(0))
                )
                .map((bodies) =>
                    bodies.filter((body) =>
                        body.every((char) => reachableSymbols.includes(char))
                    )
                )
        );
    // Return Transformed Grammar
    return transGrammar;
};

export const removeEpsilonProductions = (grammar: IIGrammar): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    //  Get Grammar Productions
    const productions = grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const ntSymbols = grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"];
    // Define Epsilon Non Terminal Set (E)
    let eSet = Immutable.OrderedSet([EPSILON]);
    // Define Iteration
    const genQSet = (symbols: IAlphabet) =>
        // X ∈ N
        ntSymbols.filter(
            (nonTerminalSymbol) =>
                // X ∉ E
                !symbols.includes(nonTerminalSymbol) &&
                // Exists at least one production X -> X1X2..XN that X1X2..X3 ∈ E
                productions
                    // Production X -> X1X2..XN
                    .find((_, head) =>
                        head.equals(Immutable.List([nonTerminalSymbol]))
                    )
                    // X1X2..X3 ∈ E
                    .some((production) =>
                        production.every((symbol) => symbols.includes(symbol))
                    )
        );
    // Iterate
    let qSet = Immutable.OrderedSet();
    do {
        // Step 1  - Q = X ∈ N and X ∉ E and exists at least one production X -> X1X2..XN that X1X2..X3 ∈ E
        qSet = genQSet(eSet);
        // Step 2 - E = E ∪ Q
        eSet = eSet.union(qSet);
    } while (!qSet.isEmpty());
    // Create the P' set (P' = {p | p ∈ P and p is not an epsilon production}) (transformed productions)
    let pQuoteSet = (grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"]).map((bodies) =>
        bodies.filter((body) => !body.includes(EPSILON))
    );
    // Create Iteration Step for P'
    const genNewPQuoteElements = (
        pSet: Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>
    ) =>
        pSet
            .map((bodies) => {
                // A -> 𝛂B𝛃 that B ∈ E and 𝛂𝛃 (N ∪ T)⋆ and 𝛂𝛃 ≠ 𝛆
                const bodiesToInclude = bodies
                    .filter(
                        // Filter Nullable Bodies
                        (body) =>
                            // 𝛂𝛃 ≠ 𝛆
                            body.size > 1 &&
                            // A -> 𝛂B𝛃 that B ∈ E
                            body.some((symbol) => eSet.includes(symbol))
                    )
                    // Compute 𝛂𝛃
                    .map((body) => {
                        const idxToRemove = body.findIndex((symbol) =>
                            eSet.includes(symbol)
                        );
                        return body.remove(idxToRemove);
                    });
                return bodiesToInclude;
            })
            .filter((bodies) => !bodies.isEmpty());
    // Iterate P' set
    let toIncludeInPQuote = Immutable.Map<
        IGrammarWord,
        Immutable.Set<IGrammarWord>
    >();
    let pQuoteChanged = false;
    do {
        // Save Old P'
        const oldPQuoteSet = pQuoteSet;
        // If exists A -> 𝛂B𝛃 that B ∈ E and 𝛂𝛃 (N ∪ T)⋆ and 𝛂𝛃 ≠ 𝛆
        toIncludeInPQuote = genNewPQuoteElements(pQuoteSet);
        // Add A -> 𝛂𝛃 in P'
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        toIncludeInPQuote.forEach((bodies, head) => {
            pQuoteSet = pQuoteSet.update(
                head,
                Immutable.Set<IGrammarWord>(),
                (oldBodies) => oldBodies.union(bodies)
            );
        });
        // Compare Sets
        pQuoteChanged = !pQuoteSet.equals(oldPQuoteSet);
    } while (pQuoteChanged);
    // Check S ∈ E
    const startSymbol = grammar.get("startSymbol") as IGrammar["startSymbol"];
    if (eSet.includes(startSymbol)) {
        // Generate new Start Symbol
        const nonTerminalSymbols = grammar.get(
            "nonTerminalSymbols"
        ) as IGrammar["nonTerminalSymbols"];
        const idGen = generateNonTerminalSymbols(nonTerminalSymbols.toArray());
        const newId = idGen.next().value;
        // N' = N ∪ {S'}
        transGrammar = transGrammar.set(
            "nonTerminalSymbols",
            nonTerminalSymbols.add(newId)
        );
        // Add S' -> S | 𝛆 into P'
        pQuoteSet = pQuoteSet.set(
            Immutable.List([newId]),
            Immutable.Set([
                Immutable.List([startSymbol]),
                Immutable.List([EPSILON]),
            ])
        );
        // Set S' as start symbol
        transGrammar = transGrammar.set("startSymbol", newId);
    }
    // Update Grammar Productions
    transGrammar = transGrammar.set("productionRules", pQuoteSet);
    // Return Transformed Grammar
    return transGrammar;
};

export const getFollows = (
    grammar: IIGrammar,
    first: Immutable.Map<string, Immutable.Set<string>>
): Immutable.Map<string, Immutable.Set<string>> => {
    // initialize non terminal symbols and follow set
    const nonTerminalSymbolsSet = grammar.get("nonTerminalSymbols");
    let follows = Immutable.Map<string, Immutable.Set<string>>();
    const hasDiff = true;

    // initial symbol receives $ in its follow set
    follows = follows.update(
        grammar.get("startSymbol") as string,
        Immutable.Set(),
        (set) => set.add("$")
    );

    for (const [, productionRules] of grammar.get(
        "productionRules"
    ) as Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>) {
        for (const body of productionRules) {
            for (const [i, symbol] of body.toIndexedSeq().entries()) {
                const isNonTerminal = (grammar.get(
                    "nonTerminalSymbols"
                ) as IAlphabet).contains(symbol);
                if (isNonTerminal) {
                    // the follow of this non terminal will receive whatever is next
                    // and whatever comes after that if they all have ε
                    for (const [, nextSymbol] of body
                        .toIndexedSeq()
                        .slice(i + 1)
                        .entries()) {
                        // add this symbol's first set to the follow set
                        follows = follows.update(
                            symbol,
                            Immutable.Set(),
                            (set) => set.union(first.get(nextSymbol))
                        );
                        const containsEpsilonInFirstSet = (first.get(
                            nextSymbol
                        ) as IAlphabet).contains("ε");
                        if (!containsEpsilonInFirstSet) {
                            break;
                        }
                    }
                }
            }
        }
    }

    for (const head of grammar.get("nonTerminalSymbols")) {
        for (const body of getBodiesOfHead(grammar, [head as string])) {
            if (
                body.last() !== EPSILON &&
                (grammar.get("nonTerminalSymbols") as IAlphabet).contains(
                    body.last()
                )
            )
                for (const [
                    ,
                    symbol,
                ] of body.reverse().toIndexedSeq().entries()) {
                    if (
                        symbol !== EPSILON &&
                        (grammar.get(
                            "nonTerminalSymbols"
                        ) as IAlphabet).contains(symbol)
                    ) {
                        // add the follow set of the head to the follow of this symbol
                        // TODO optimize without eslint ignore
                        follows = follows.update(
                            symbol,
                            Immutable.Set(),
                            // eslint-disable-next-line @typescript-eslint/no-loop-func
                            (set) => set.union(follows.get(head as string))
                        );
                        if (!first.get(symbol).contains(EPSILON)) break;
                    } else break;
                }
        }
    }

    // before returning, remove epsilon from each follow set
    follows = follows.map((set) => set.remove(EPSILON));
    return follows;
};

export const removeUnitProductions = (grammar: IIGrammar): IIGrammar => {
    // Define Transformed Grammar
    let transGrammar = grammar;
    const productions = grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const ntSymbols = grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"];
    // Define N Base Sets (N(A) = {A})
    let nSet = (grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"]).reduce(
        (nSetRed, ntSymbol) =>
            nSetRed.set(
                ntSymbol,
                productions
                    .get(Immutable.List([ntSymbol]))
                    .flatMap((body) =>
                        body.filter((char) => ntSymbols.includes(char))
                    )
                    .add(ntSymbol)
            ),
        Immutable.Map<string, Immutable.Set<string>>()
    );
    // Define N construction iteration
    const genNewNSet = (
        currNSet: Immutable.Map<string, Immutable.Set<string>>
    ) =>
        currNSet.map((nOfNt) =>
            // N(A) = {B | A => B with B ∈ N} ∪ A
            nOfNt.flatMap((ntInsideNOfNt) => currNSet.get(ntInsideNOfNt))
        );
    // Iterate to build N Sets
    let hasDiff = false;
    do {
        // Save Old nSet
        const oldNSet = nSet;
        // Compute new N Set
        nSet = genNewNSet(nSet);
        // Check diff
        hasDiff = !oldNSet.equals(nSet);
    } while (hasDiff);
    // Pre-Compute all non unitary production
    const nonUnitaryProductions = productions.map((bodies) =>
        bodies.filter(
            (body) => body.size > 1 || !ntSymbols.includes(body.get(0))
        )
    );
    // Define New Productions
    const newProductions = nSet
        .map((nOfNT) =>
            nOfNT.flatMap((nonTerminalSymbol) =>
                nonUnitaryProductions.get(Immutable.List([nonTerminalSymbol]))
            )
        )
        .mapKeys((ntSymbol) => Immutable.List([ntSymbol]));
    // Update Grammar
    transGrammar = transGrammar.set("productionRules", newProductions);
    // Return Transformed Grammar
    return transGrammar;
};

export const getFirsts = (
    grammar: IIGrammar
): Immutable.Map<string, Immutable.Set<string>> => {
    // Fetch Productions
    const productions = grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const terminalSymbols = grammar.get(
        "terminalSymbols"
    ) as IGrammar["terminalSymbols"];
    // Define Firsts Set (Start with the terminal Symbols)
    let firstsSet = terminalSymbols
        .toMap()
        .map((symbol) => Immutable.Set([symbol]));
    // Compute Firsts of Non Terminal Symbols
    const getNewFirstsSet = (
        firstsSetOriginal: Immutable.Map<string, Immutable.Set<string>>
    ) => {
        // Iterate over all productions
        return productions.reduce(
            (firstsSetIt, bodies, head) =>
                // Update the FIRST(X) (or create it)
                firstsSetIt.update(
                    head.get(0),
                    Immutable.Set(),
                    (firstsSetItOld) =>
                        firstsSetItOld.union(
                            // Compute FIRST(X) with previously computed FIRSTs
                            bodies.reduce((firstSymbolsSet, body) => {
                                // Cases
                                // a) X -> 𝛂Y
                                // b) X -> 𝛆
                                const firstElementOfBody = body.get(0);
                                if (
                                    terminalSymbols
                                        .add(EPSILON)
                                        .includes(firstElementOfBody)
                                ) {
                                    return firstSymbolsSet.add(
                                        firstElementOfBody
                                    );
                                }
                                // Case c) X -> Y1Y2..YK
                                let bodyFirsts = firstSymbolsSet;
                                // Iterate over YN, N = 1..K
                                for (const char of body) {
                                    // Get FIRST(YN)
                                    const firstsOfChar = firstsSetOriginal.get(
                                        char,
                                        Immutable.Set<string>()
                                    );
                                    // Add FIRST(YN) into FIRST(X) (Without adding epsilon)
                                    bodyFirsts = bodyFirsts.union(
                                        firstsOfChar.remove(EPSILON)
                                    );
                                    // Check if need to add FIRST(YN+1) into FIRST(X)
                                    const epsilonInElement = firstsOfChar.includes(
                                        EPSILON
                                    );
                                    if (!epsilonInElement) {
                                        return bodyFirsts;
                                    }
                                }
                                // Here, all YN have epsilon, so, add it to FIRST(X) (Case c-iii)
                                return bodyFirsts.add(EPSILON);
                            }, Immutable.Set<string>())
                        )
                ),
            firstsSetOriginal
        );
    };
    // Compute while has diff between firsts sets
    let hasDiff = false;
    do {
        // Save Old Iteration
        const oldFirstsSet = firstsSet;
        // Iterate
        firstsSet = getNewFirstsSet(firstsSet);
        // Check Diff
        hasDiff = !firstsSet.equals(oldFirstsSet);
    } while (hasDiff);
    // Return the Firsts Set
    return firstsSet;
};

export const getAnalysisTable = (
    grammar: IIGrammar
): Immutable.Map<IGrammarWord, Immutable.Map<string, IGrammarWord>> => {
    const grammarWithEndOfStack = grammar.update(
        "terminalSymbols",
        (tSymbols: IGrammar["terminalSymbols"]) => tSymbols.add(END_OF_STACK)
    );
    const nonTerminalSymbols = grammarWithEndOfStack.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"];
    const terminalSymbols = grammarWithEndOfStack.get(
        "terminalSymbols"
    ) as IGrammar["terminalSymbols"];
    // Get Grammar productions
    const productions = grammarWithEndOfStack.get(
        "productionRules"
    ) as IGrammar["productionRules"];
    const firsts = getFirsts(grammarWithEndOfStack);
    const follows = getFollows(grammarWithEndOfStack, firsts);
    // Define Table Base (NT -> T -> error (null))
    let analysisTable: Immutable.Map<
        IGrammarWord,
        Immutable.Map<string, IGrammarWord>
    > = nonTerminalSymbols
        .toMap()
        .mapEntries(([ntSymbol]) => [
            Immutable.List([ntSymbol]),
            terminalSymbols.toMap().map(() => null),
        ]);
    // For every production A -> 𝛂 of the grammar
    for (const [head, bodies] of productions.entries()) {
        for (const body of bodies) {
            const firstChar = body.get(0);
            const firstCharFirst = firsts.get(firstChar);
            // For every a in FIRST(𝛂), add A -> 𝛂, in M[A,a]
            for (const char of firstCharFirst) {
                analysisTable = analysisTable.setIn([head, char], body);
            }
            // If 𝛆 ∈ FIRST(𝛂)
            if (firstCharFirst.includes(EPSILON)) {
                // Then add A -> 𝛂 in M[A,b], ∀b ∈ FOLLOW(A)
                for (const char of follows.get(head.get(0))) {
                    analysisTable = analysisTable.setIn([head, char], body);
                }
                // Then add A -> 𝛂 in M[A,b], ∀b ∈ FOLLOW(𝛂)
                if (nonTerminalSymbols.includes(firstChar)) {
                    for (const char of follows.get(firstChar)) {
                        analysisTable = analysisTable.setIn([head, char], body);
                    }
                }
            }
        }
    }
    // Return Analysis table
    return analysisTable;
};

export const runTableLL1 = (
    input: string,
    grammar: IIGrammar,
    table: Immutable.Map<IGrammarWord, Immutable.Map<string, IGrammarWord>>
): boolean => {
    const adjustedInput = [...input.split(""), "$"];
    console.log(adjustedInput.toString());
    let stack = Immutable.Stack<string>()
        .push("$")
        .push(grammar.get("startSymbol") as string);
    console.log(stack.toJS());

    let head = 0;
    while (true) {
        if (stack.peek() === adjustedInput[head] && stack.peek() === "$") {
            return true;
            // eslint-disable-next-line no-else-return
        } else if (stack.peek() === adjustedInput[head]) {
            // unstack
            stack = stack.pop();
            // get next simbol
            head++;
        } else if (
            (grammar.get("nonTerminalSymbols") as IAlphabet).contains(
                stack.peek()
            )
        ) {
            const tableEntry = table.getIn([
                Immutable.List([stack.peek()]),
                adjustedInput[head],
            ]) as IGrammarWord;
            if (tableEntry === null || tableEntry === undefined) return false;
            if (tableEntry.join() !== EPSILON) {
                // pop backwards
                stack = stack.pop();
                // push backwards
                for (const symbol of tableEntry.reverse()) {
                    stack = stack.push(symbol);
                }
            } else {
                // is epsilon, must pop
                stack = stack.pop();
            }
        } else return false;
        console.log(stack.toJS());
    }
    return false;
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
