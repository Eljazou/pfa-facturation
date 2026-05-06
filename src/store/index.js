import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import clientsReducer from '../features/clients/clientsSlice';
import articlesReducer from '../features/articles/articlesSlice';
import invoicesReducer from '../features/invoices/invoicesSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import toastReducer from '../features/notifications/toastSlice';
import settingsReducer from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    articles: articlesReducer,
    invoices: invoicesReducer,
    notifications: notificationsReducer,
    toast: toastReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
