import { Action } from "redux";

export interface AppAction<P extends any = any, T extends any = any>
  extends Action<T> {
  payload: P;
}

export type AppActionCreator<A, R extends AppAction<any>> = (args: A) => R;
export type AppReducer<S> = (state: S, action: AppAction) => S;
