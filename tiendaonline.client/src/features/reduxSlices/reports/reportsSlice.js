import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsService } from '../../../api/endpoints/reports';

export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const result = await ReportsService.getAll();
      // Normaliza la respuesta: puede venir como { data: [...] } o solo [...]
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.data)) return result.data;
      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Error al cargar reportes');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reportsSlice.reducer;
