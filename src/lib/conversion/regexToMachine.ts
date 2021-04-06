/* eslint-disable no-nested-ternary */
// Import Dependencies
import { getNewMachine, MachineType } from "@/database/schema/machine";
import Immutable from "immutable";
import TreeUtils from "immutable-treeutils";
import { EPSILON } from "../AlphabetSymbol";
import { IIMachine, IITransition, ITransition } from "../automaton/Machine";
import { IIState, IState } from "../automaton/State";
import { IIRegex } from "../expressions/Regex";
// Define Types
export enum EASTNodeType {
    CHAR = "char",
    OR = "or",
    CONCAT = "concat",
    CLOJURE = "closure",
}
export enum EASTOperators {
    CONCAT = "•",
    OR = "|",
    CLOJURE = "*",
}
export interface IAhoSyntaxTreeNode {
    id: number;
    type: EASTNodeType;
    content?: string;
    left?: IIAhoSyntaxTreeNode;
    right?: IIAhoSyntaxTreeNode;
}
export type IIAhoSyntaxTreeNode = Immutable.Map<
    keyof IAhoSyntaxTreeNode,
    IAhoSyntaxTreeNode[keyof IAhoSyntaxTreeNode]
>;
type RecursiveArray<T = string> = Array<T | RecursiveArray<T>>;
type ITreeNodeArray = [
    left: RecursiveArray<string>,
    right: RecursiveArray<string>,
    operator: EASTOperators
];
type ITreeNodeArrayClojure = [
    left: RecursiveArray<string>,
    operator: EASTOperators
];
interface ITreeNode {
    id: number;
    left: ITreeNode;
    right?: ITreeNode;
    content: string;
    firstPos: Array<number>;
    lastPos: Array<number>;
    nullable: boolean;
    followPos?: Array<number>;
}
// Define Helpers
function* generateIds() {
    let currId = 0;
    while (true) {
        currId += 1;
        yield currId;
    }
}

export const searchForParentheses = (
    tokens: RecursiveArray<string>
): RecursiveArray<string> => {
    // Use Old Style Split
    let firstNestedIdx = -1;
    let lastNestedIdx = -1;
    let nestedCount = 0;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === "(") {
            if (nestedCount === 0) {
                // First Nested Scope
                firstNestedIdx = i;
            }
            // Open Nested Scope
            nestedCount++;
        } else if (token === ")") {
            // End Nested Scope
            nestedCount--;
            if (nestedCount === 0) {
                // Ended First Nested Scope
                lastNestedIdx = i;
                break;
            }
        }
    }
    // Compute Resulting Array
    if (firstNestedIdx >= 0 && lastNestedIdx >= 0) {
        const left = tokens.slice(0, firstNestedIdx);
        const middleBase = tokens.slice(firstNestedIdx + 1, lastNestedIdx);
        const right = tokens.slice(lastNestedIdx + 1);
        // Compute Middle Array
        const middle = searchForParentheses(middleBase);
        return [].concat(left, [middle], right);
    }
    return tokens;
};

export const searchForClojures = (
    tokens: RecursiveArray<string>
): RecursiveArray<string> => {
    // Use Old Style Search
    const mutTokens = [...tokens];
    for (let i = 0; i < mutTokens.length; i++) {
        const token = mutTokens[i];
        // Check Nested Structures
        if (Array.isArray(token)) {
            const nested = searchForClojures(
                mutTokens[i] as RecursiveArray<string>
            );
            mutTokens[i] = nested.length > 1 ? nested : nested[0];
        }
        // Check for Clojure
        else if (token === "*") {
            // Found Clojure
            const lastElementIdx = i - 1;
            const nextElementIdx = i + 1;
            const lastElement = mutTokens[lastElementIdx];
            const clojureArgs = Array.isArray(lastElement)
                ? lastElement
                : [lastElement];
            // Filter Arrays
            const left = mutTokens.slice(0, lastElementIdx);
            const rightBase = tokens.slice(nextElementIdx);
            const middle = [[searchForClojures(clojureArgs), "*"]];
            const right = searchForClojures(rightBase);
            // Return Concat Arrays
            return [].concat(left, middle, right);
        }
    }
    return mutTokens;
};

export const searchForOr = (
    tokens: RecursiveArray<string>
): RecursiveArray<string> => {
    // Use Old Style Search
    const mutTokens = [...tokens];
    for (let i = 0; i < mutTokens.length; i++) {
        const token = mutTokens[i];
        // Check Nested Structures
        if (Array.isArray(token)) {
            const nested = searchForOr(mutTokens[i] as RecursiveArray<string>);
            mutTokens[i] = nested.length > 1 ? nested : nested[0];
        }
        // Check for Disjunction
        else if (token === "|") {
            const orIdx = i;
            const leftBase = mutTokens.slice(0, orIdx);
            const rightBase = mutTokens.slice(orIdx + 1);
            // Define Return
            const rightTransformed = searchForOr(rightBase);
            const left =
                leftBase.length === 1 && Array.isArray(leftBase[0])
                    ? leftBase[0]
                    : leftBase;
            const right =
                rightTransformed.length === 1 &&
                Array.isArray(rightTransformed[0])
                    ? rightTransformed[0]
                    : rightTransformed;
            // Return Array
            return [left, right, "|"];
        }
    }
    return mutTokens;
};

export const searchForConcatenations = (
    tokens: RecursiveArray<string>
): RecursiveArray<string> => {
    const mutTokens = [...tokens];
    // Fetch Operator
    const maybeOp = mutTokens[tokens.length - 1];
    let restOfTokens = mutTokens.slice(0, mutTokens.length - 1);
    const right = Array.isArray(maybeOp)
        ? searchForConcatenations(maybeOp)
        : [maybeOp];
    switch (maybeOp) {
        case "*":
            return [
                searchForConcatenations(mutTokens[0] as RecursiveArray<string>),
                "*",
            ];
        case "|":
            return [
                searchForConcatenations(mutTokens[0] as RecursiveArray<string>),
                searchForConcatenations(mutTokens[1] as RecursiveArray<string>),
                "|",
            ];
        default:
            if (mutTokens.length === 1) {
                return mutTokens;
            }
            restOfTokens =
                restOfTokens.length === 1 && Array.isArray(restOfTokens[0])
                    ? restOfTokens[0]
                    : restOfTokens;
            return [searchForConcatenations(restOfTokens), right, "•"];
    }
};

export const createNode = (
    arr: RecursiveArray<string>,
    idGen: Generator<number>
): ITreeNode => {
    const opCode = { "*": -1, "|": -2, "•": -3 };
    if (arr.length === 3) {
        // Node Is Op
        const [leftArr, rightArr, op] = arr as ITreeNodeArray;
        const left = createNode(leftArr, idGen);
        const right = createNode(rightArr, idGen);
        return {
            id: opCode[op],
            content: op,
            left,
            right,
            nullable:
                op === EASTOperators.CLOJURE
                    ? true
                    : op === EASTOperators.OR
                    ? left.nullable || right.nullable
                    : left.nullable && right.nullable,
            firstPos:
                op === EASTOperators.CLOJURE
                    ? [...left.firstPos]
                    : op === EASTOperators.OR
                    ? Immutable.Set(left.firstPos)
                          .union(Immutable.Set(right.firstPos))
                          .toArray()
                    : left.nullable
                    ? Immutable.Set(left.firstPos)
                          .union(Immutable.Set(right.firstPos))
                          .toArray()
                    : [...left.firstPos],
            lastPos:
                op === EASTOperators.CLOJURE
                    ? [...left.lastPos]
                    : op === EASTOperators.OR
                    ? Immutable.Set(right.lastPos)
                          .union(Immutable.Set(left.lastPos))
                          .toArray()
                    : right.nullable
                    ? Immutable.Set(right.lastPos)
                          .union(Immutable.Set(left.lastPos))
                          .toArray()
                    : [...right.lastPos],
        };
    }
    if (arr.length === 2) {
        // Node Is Op
        const [leftArr, op] = arr as ITreeNodeArrayClojure;
        const left = createNode(leftArr, idGen);
        return {
            id: opCode[op],
            content: op,
            left,
            nullable: true,
            firstPos: [...left.firstPos],
            lastPos: [...left.firstPos],
        };
    }
    // Node Is Leaf
    const [content] = arr as [string];
    const nodeId = idGen.next().value;
    return {
        id: nodeId,
        content,
        left: null,
        right: null,
        nullable: content === EPSILON,
        firstPos: content === EPSILON ? [] : [nodeId],
        lastPos: content === EPSILON ? [] : [nodeId],
        followPos: [],
    };
};

export const getLeafNodes = (node: ITreeNode): Array<ITreeNode> => {
    if (!node) {
        return [];
    }
    if (node.id > 0) {
        return [node];
    }
    return [].concat(getLeafNodes(node.left), getLeafNodes(node.right));
};

export const getClojureNodes = (node: ITreeNode): Array<ITreeNode> => {
    if (!node) {
        return [];
    }
    if (node.content === EASTOperators.CLOJURE) {
        return [].concat([node], getClojureNodes(node.left));
    }
    return [].concat(getClojureNodes(node.left), getClojureNodes(node.right));
};

export const getConcatNodes = (node: ITreeNode): Array<ITreeNode> => {
    if (!node) {
        return [];
    }
    if (node.content === EASTOperators.CONCAT) {
        return [].concat(
            [node],
            getConcatNodes(node.left),
            getConcatNodes(node.right)
        );
    }
    return [].concat(getConcatNodes(node.left), getConcatNodes(node.right));
};

export const updateFollowPos = (rootNode: ITreeNode): void => {
    // Get Filtered Nodes
    const leafNodes = getLeafNodes(rootNode);
    const concatNodes = getConcatNodes(rootNode);
    const clojureNodes = getClojureNodes(rootNode);
    // Define FollowPos
    clojureNodes.forEach((clNode) => {
        clNode.lastPos.forEach((nodeId) => {
            const targetNode = leafNodes.find((node) => node.id === nodeId);
            targetNode.followPos = Immutable.Set(targetNode.followPos)
                .union(Immutable.Set(clNode.firstPos))
                .toArray();
        });
    });
    concatNodes.forEach((coNode) => {
        coNode.left.lastPos.forEach((nodeId) => {
            const targetNode = leafNodes.find((node) => node.id === nodeId);
            targetNode.followPos = Immutable.Set(targetNode.followPos)
                .union(Immutable.Set(coNode.right.firstPos))
                .toArray();
        });
    });
};

export const buildAhoTree = (expression: string): ITreeNode => {
    // Build Expanded Expression (Reverse Mode)
    const expandedExpression = `${expression}#`.split("");
    // Define Tree
    const idGen = generateIds();
    // Iterate Over Word
    const parsedNestings = searchForParentheses(expandedExpression);
    const parsedClojure = searchForClojures(parsedNestings);
    const parsedOr = searchForOr(parsedClojure);
    const parsedConcatenations = searchForConcatenations(parsedOr);
    // Build Tree
    const rootNode = createNode(parsedConcatenations, idGen);
    // Compute Follow Pos
    updateFollowPos(rootNode);
    // Return Tree
    return rootNode;
};

export const getAlphabetOfExpression = (
    expressionStr: string
): Array<string> => {
    return expressionStr
        .split("")
        .filter((str) => !["(", ")", "|", "*", "•"].includes(str));
};

// Define Converions
export default function convertFiniteStateMachineToRegularGrammar(
    regex: IIRegex
): IIMachine {
    // Get Expression
    const expression = (regex.get("expression") as string)
        .replace(/ /g, "")
        .replace(/&/g, EPSILON);
    // Get Alphabet
    const alphabet = getAlphabetOfExpression(expression);
    // Parse as Aho Tree
    const tree = buildAhoTree(expression);
    // Define Transitions
    let transitions = Immutable.Set<IITransition>();
    const leafNodes = getLeafNodes(tree);
    const entry = tree.firstPos.sort().join("");
    const dstates: Array<[dstate: Array<number>, visited: boolean]> = [
        [tree.firstPos.sort(), false],
    ];
    while (dstates.filter(([, visited]) => !visited).length > 0) {
        const stateIdx = dstates.findIndex(([, v]) => !v);
        const state = dstates[stateIdx];
        state[1] = true;
        const dstate = state[0];
        const transitionFrom = dstate.sort().join("");
        const filteredNodes = leafNodes.filter((n) => dstate.includes(n.id));
        for (const char of alphabet) {
            const transitionWith = char;
            const charStateSet = filteredNodes
                .filter((n) => n.content === char)
                .map((n) => Immutable.Set(n.followPos))
                .reduce((acc, fp) => acc.union(fp))
                .sort();
            const transitionTo = charStateSet.join("");
            if (
                !dstates.find(([fpp]) =>
                    Immutable.Set(fpp).sort().equals(charStateSet)
                )
            ) {
                dstates.push([charStateSet.toArray(), false]);
            }
            transitions = transitions.add(
                Immutable.Map({
                    pop: null,
                    push: null,
                    from: transitionFrom,
                    with: transitionWith,
                    to: transitionTo,
                }) as IITransition
            );
        }
    }
    const lastId = tree.lastPos.sort().join("");
    const states = Immutable.Set(
        dstates.map(([stateArr]) => {
            const stateId = stateArr.sort().join("");
            return Immutable.Map({
                id: stateId,
                isEntry: stateId === entry,
                isExit: stateId.endsWith(lastId),
            }) as IIState;
        })
    )
        .toMap()
        .mapKeys((s) => s.get("id") as string);
    // Build Machine
    const machine: IIMachine = Immutable.Map({
        ...getNewMachine(MachineType.FINITE_STATE_MACHINE, false),
        transitions,
        states,
        exitStates: states.filter((state) => state.get("isExit")),
        entry: states.find((state) => !!state.get("isEntry")),
        alphabet: Immutable.Set(alphabet),
    }) as IIMachine;
    // Return Builded Machine
    return machine;
}
