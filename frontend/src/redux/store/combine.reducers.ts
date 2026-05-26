import { combineReducers } from "@reduxjs/toolkit";
import authReducer, { AuthState } from "./slices/authSlice";
import propertyReducer, { PropertyState } from "./slices/managePropertySlice";

export interface CombinedReducerType {
  auth: AuthState;
  property: PropertyState;
}

const rootReducer = combineReducers({
  auth: authReducer,
  property: propertyReducer,
});

export default rootReducer;
