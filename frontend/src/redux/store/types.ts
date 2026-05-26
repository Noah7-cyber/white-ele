export interface AuthReduxState {
  refreshToken?: { _time_stamp: string };
  accessToken?: { _time_stamp: string };
}

export type CombinedReducerType = {
  authentication: AuthReduxState;
};
