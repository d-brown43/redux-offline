import {Action} from "redux";

export interface AppAction<P extends any> extends Action {
  payload: P
}

export type AppActionCreator<A, R extends AppAction<any>> = (args: A) => R;
export type AppReducer<S, A> = (state: S, action: A) => S;
