import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SiteSettingsService } from '@/api/endpoints/siteSettings';

// Thunks
export const fetchSiteSettings = createAsyncThunk(
  'siteSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await SiteSettingsService.get();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateSiteSettings = createAsyncThunk(
  'siteSettings/update',
  async (data, { rejectWithValue }) => {
    try {
      const res = await SiteSettingsService.update(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  data: null,
  loading: false,
  error: null,
  success: null
};

const siteSettingsSlice = createSlice({
  name: 'siteSettings',
  initialState,
  reducers: {
    clearSiteSettingsState: (state) => {
      state.error = null;
      state.success = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchSiteSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.success = 'Configuración cargada';
      })
      .addCase(fetchSiteSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSiteSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateSiteSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.success = 'Configuración actualizada';
      })
      .addCase(updateSiteSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSiteSettingsState } = siteSettingsSlice.actions;
export default siteSettingsSlice.reducer;
