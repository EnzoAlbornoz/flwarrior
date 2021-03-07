import Immutable from "immutable";

export type IState = {
    id: string;
    isEntry: boolean;
    isExit: boolean;
};

export type IIState = Immutable.Map<keyof IState, IState[keyof IState]>;
