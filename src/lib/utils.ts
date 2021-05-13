import { MachineDBEntry, MachineType } from "../database/schema/machine";

export function arrayCompare<L, R>(
    compare: (left: L, right: R) => boolean,
    leftArray: Array<L>,
    rightArray: Array<R>
): boolean {
    const [left, ...nLeftArray] = leftArray;
    const [right, ...nRightArray] = rightArray;

    if (left === undefined && right === undefined) {
        return true;
    }

    return (
        compare(left, right) && arrayCompare(compare, nLeftArray, nRightArray)
    );
}
export function verifyMachineDBType(machine: MachineDBEntry): MachineType {
    let hasMemory = false;
    for (const transition of machine.transitions) {
        if (transition.with.memory !== null) hasMemory = true;
        if (transition.to.headDirection !== null)
            return MachineType.TURING_MACHINE;
    }
    if (hasMemory) return MachineType.PUSHDOWN_MACHINE;
    return MachineType.FINITE_STATE_MACHINE;
}

export function identifyCommomPrefix(...strings: string[]): string {
    const shortestSize = strings.reduce(
        (minV, curS) => Math.min(minV, curS.length),
        strings[0].length
    );
    let commonPrefix = "";
    // Iterate over strings
    const charsAreTheSame = (
        currentChar: string,
        currentIteration: number
    ): boolean => {
        for (let j = 1; j < strings.length; j++) {
            if (currentChar !== strings[j][currentIteration]) {
                return false;
            }
        }
        return true;
    };
    for (let i = 0; i < shortestSize; i++) {
        const currentChar = strings[0][i];
        if (charsAreTheSame(currentChar, i)) {
            commonPrefix += currentChar;
        } else {
            break;
        }
    }
    return commonPrefix;
}
