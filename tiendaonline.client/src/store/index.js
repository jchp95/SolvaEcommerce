// store.js
import { configureStore } from '@reduxjs/toolkit';
import siteSettingsReducer from '../features/reduxSlices/siteSettings/siteSettingsSlice';
import productsReducer from '../features/reduxSlices/products/productsSlice';
import categoriesReducer from '../features/reduxSlices/categories/categoriesSlice';
import reportsReducer from '../features/reduxSlices/reports/reportsSlice';
import authReducer from '../features/reduxSlices/auth/authSlice';
import spinnerReducer from '../features/reduxSlices/spinner/spinnerSlice';
import suppliersReducer from '../features/reduxSlices/suppliers/suppliersSlice';
import ordersReducer from '../features/reduxSlices/orders/ordersSlice';


const store = configureStore({
  reducer: {
    siteSettings: siteSettingsReducer,
    products: productsReducer,
    categories: categoriesReducer,
    reports: reportsReducer,
    auth: authReducer,
    spinner: spinnerReducer,
    suppliers: suppliersReducer,
    orders: ordersReducer, // ← Nueva línea agregada
  },
});

export default store;