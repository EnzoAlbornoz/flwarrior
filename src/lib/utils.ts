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

export function machineIsDeterministic(...args: unknown[]): boolean {
    console.log(args);
    return true;
}
