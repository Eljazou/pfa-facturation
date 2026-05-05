import { createSlice } from '@reduxjs/toolkit';

let toastId = 0;
const nextId = () => `t_${Date.now()}_${++toastId}`;

const toastSlice = createSlice({
  name: 'toast',
  initialState: { toasts: [] },
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
        if (state.toasts.length > 3) state.toasts.shift();
      },
      prepare({ message, severity = 'info' }) {
        return { payload: { id: nextId(), message, severity } };
      },
    },
    hideToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
