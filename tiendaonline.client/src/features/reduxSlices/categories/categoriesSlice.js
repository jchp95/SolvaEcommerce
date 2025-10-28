import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CategoryService } from '../../../api/endpoints/categories';

// Thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getAll();
      return response.data || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar categorías');
    }
  }
);

// NUEVO THUNK PARA BÚSQUEDA
export const searchCategories = createAsyncThunk(
  'categories/search',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await CategoryService.search(searchTerm);
      return response.data || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al buscar categorías');
    }
  }
);

// NUEVO THUNK PARA OBTENER POR NIVEL
export const fetchCategoriesByLevel = createAsyncThunk(
  'categories/fetchByLevel',
  async (parentId = null, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getByLevel(parentId);
      return response.data || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar categorías por nivel');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data, { rejectWithValue }) => {
    try {
      // ENVIAR TODOS LOS CAMPOS REQUERIDOS POR EL BACKEND
      const payload = { 
        name: data.name, 
        description: data.description,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        displayOrder: data.displayOrder || 0,
        parentCategoryId: data.parentCategoryId || null,
        isActive: true
      };
      const result = await CategoryService.create(payload);
      if (result && result.data) return result.data;
      return result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Error al crear categoría');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // ENVIAR TODOS LOS CAMPOS ACTUALIZADOS
      const payload = { 
        id,
        name: data.name, 
        description: data.description,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        displayOrder: data.displayOrder || 0,
        parentCategoryId: data.parentCategoryId || null,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription
      };
      const result = await CategoryService.update(id, payload);
      if (result && result.data) return result.data;
      return result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Error al actualizar categoría');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await CategoryService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar categoría');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    searchResults: [],
    levelItems: [],
    loading: false,
    searchLoading: false,
    levelLoading: false,
    error: null,
    searchError: null,
    levelError: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearLevelItems: (state) => {
      state.levelItems = [];
      state.levelError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search categories
      .addCase(searchCategories.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchCategories.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchCategories.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      // Categories by level
      .addCase(fetchCategoriesByLevel.pending, (state) => {
        state.levelLoading = true;
        state.levelError = null;
      })
      .addCase(fetchCategoriesByLevel.fulfilled, (state, action) => {
        state.levelLoading = false;
        state.levelItems = action.payload;
      })
      .addCase(fetchCategoriesByLevel.rejected, (state, action) => {
        state.levelLoading = false;
        state.levelError = action.payload;
      })
      // Create, update, delete
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex(cat => cat.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(cat => cat.id !== action.payload);
      });
  },
});

export const { clearSearchResults, clearLevelItems } = categoriesSlice.actions;
export default categoriesSlice.reducer;