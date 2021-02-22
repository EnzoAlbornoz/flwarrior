import { MachineDBEntry, MachineType } from "@database/schema/machine";
import AlphabetSymbol from "./AlphabetSymbol";

export type Tuple<T1, T2> = [T1, T2];
// const arrayCompare = (f) => ([x, ...xs: any]) => ([y, ...ys]) =>
//     x === undefined && y === undefined
//         ? true
//         : Boolean(f(x)(y)) && arrayCompare(f)(xs)(ys);
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

export function machineIsDeterministic(machine: MachineDBEntry): boolean {
    return !machine.transitions.some((t) => {
        return t.with.head === AlphabetSymbol.EPSILON.symbol;
    });
}
