import Immutable from "immutable";

export type IState = {
    id: string;
    isEntry: boolean;
    isExit: boolean;
};

export type IIState = Immutable.Map<keyof IState, IState[keyof IState]>;

export const getNewState = (newStateId: string): IState => ({
    id: newStateId,
    isEntry: false,
    isExit: false,
});
