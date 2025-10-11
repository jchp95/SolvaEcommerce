// api/endpoints/reports.js
import apiClient from '../client';

export const ReportsService = {
  // devuelve el axios response completo (NO hagas .then(...data))
  getAll: () => 
    apiClient.get('/reports')
        .then(response => response.data),
};
