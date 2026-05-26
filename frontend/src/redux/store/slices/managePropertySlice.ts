/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { PersistConfig, persistReducer } from "redux-persist";

export interface PropertyState {
  propertyPreview: any;
}

const initialState: PropertyState = {
  propertyPreview: null,
};

const managePropertySlice = createSlice({
  name: "manageProperty",
  initialState,
  reducers: {
    setPropertyPreview: (state, action: PayloadAction<any>) => {
      state.propertyPreview = action.payload;
    },
  },
});

export const { setPropertyPreview } = managePropertySlice.actions;

// ✅ Correct persist configuration
const persistConfig: PersistConfig<PropertyState> = {
  key: "manageProperty",
  storage,
  whitelist: ["propertyPreview"],
};

export default persistReducer(persistConfig, managePropertySlice.reducer);
