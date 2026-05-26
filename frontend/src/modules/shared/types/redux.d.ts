interface AuthReduxState {
  accessToken: { token: string; _time_stamp: string } | null;
  refreshToken: { token: string; _time_stamp: string } | null;
  keepMeLoggedIn: boolean;
  currentAPIUrl: string | null;
}
