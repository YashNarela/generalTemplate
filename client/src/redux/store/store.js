import { configureStore } from "@reduxjs/toolkit";

import Reducers from "../slices/firstSlice";
const store = configureStore({
  reducer: {
    //  your answer that is reducer will be here

    rnd: Reducers,
  },
});


export default store;