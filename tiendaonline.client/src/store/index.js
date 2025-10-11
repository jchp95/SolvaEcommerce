import { configureStore } from '@reduxjs/toolkit';
import siteSettingsReducer from '../features/reduxSlices/siteSettings/siteSettingsSlice';

const store = configureStore({
  reducer: {
    siteSettings: siteSettingsReducer,
  },
});

export default store;
