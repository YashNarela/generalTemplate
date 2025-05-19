import { createSlice } from "@reduxjs/toolkit";

const firstSlice = createSlice({
  name: "firstSlice",

  initialState: {
    value: 0,
  },

  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

export const { increment } = firstSlice.actions;

export default firstSlice.reducer;
