import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    pendingCount: 0,
  },
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
    },
    markAsRead(state, action) {
      const n = state.notifications.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    markAllAsRead(state) {
      state.notifications.forEach((n) => { n.read = true; });
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    setPendingCount(state, action) {
      state.pendingCount = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setPendingCount,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
