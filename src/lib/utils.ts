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
