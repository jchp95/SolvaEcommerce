import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  color: '#36D7B7',
  size: 60,
  speedMultiplier: 1,
};

const spinnerSlice = createSlice({
  name: 'spinner',
  initialState,
  reducers: {
    showSpinner: (state, action) => {
      state.loading = true;
      if (action.payload) {
        state.color = action.payload.color || state.color;
        state.size = action.payload.size || state.size;
        state.speedMultiplier = action.payload.speedMultiplier || state.speedMultiplier;
      }
    },
    hideSpinner: (state) => {
      state.loading = false;
    },
    setSpinnerProps: (state, action) => {
      if (action.payload) {
        state.color = action.payload.color || state.color;
        state.size = action.payload.size || state.size;
        state.speedMultiplier = action.payload.speedMultiplier || state.speedMultiplier;
      }
    }
  },
});

export const { showSpinner, hideSpinner, setSpinnerProps } = spinnerSlice.actions;
export default spinnerSlice.reducer;
