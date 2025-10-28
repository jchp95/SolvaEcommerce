// features/reduxSlices/suppliers/suppliersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SupplierService } from '../../../api/endpoints/supplier';

// Thunks
export const fetchSupplierProfile = createAsyncThunk(
  'suppliers/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await SupplierService.getMySupplier();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createSupplier = createAsyncThunk(
  'suppliers/createSupplier',
  async (formData, { rejectWithValue }) => {
    try {
      return await SupplierService.create(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear proveedor');
    }
  }
);

export const updateSupplierProfile = createAsyncThunk(
  'suppliers/updateProfile',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await SupplierService.update(id, formData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllSuppliers = createAsyncThunk(
  'suppliers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await SupplierService.getAll();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSupplierById = createAsyncThunk(
  'suppliers/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await SupplierService.getById(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'suppliers/deleteSupplier',
  async (id, { rejectWithValue }) => {
    try {
      await SupplierService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const verifySupplier = createAsyncThunk(
  'suppliers/verifySupplier',
  async (id, { rejectWithValue }) => {
    try {
      return await SupplierService.verify(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const suspendSupplier = createAsyncThunk(
  'suppliers/suspendSupplier',
  async (id, { rejectWithValue }) => {
    try {
      return await SupplierService.suspend(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const activateSupplier = createAsyncThunk(
  'suppliers/activateSupplier',
  async (id, { rejectWithValue }) => {
    try {
      return await SupplierService.activate(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSupplierProducts = createAsyncThunk(
  'suppliers/fetchProducts',
  async (supplierId, { rejectWithValue }) => {
    try {
      return await SupplierService.getProducts(supplierId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSupplierManagers = createAsyncThunk(
  'suppliers/fetchManagers',
  async (supplierId, { rejectWithValue }) => {
    try {
      return await SupplierService.getManagers(supplierId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addSupplierManager = createAsyncThunk(
  'suppliers/addManager',
  async ({ supplierId, managerData }, { rejectWithValue }) => {
    try {
      return await SupplierService.addManager(supplierId, managerData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const removeSupplierManager = createAsyncThunk(
  'suppliers/removeManager',
  async ({ supplierId, managerUserId }, { rejectWithValue }) => {
    try {
      await SupplierService.removeManager(supplierId, managerUserId);
      return { supplierId, managerUserId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  profile: null,
  suppliers: [],
  currentSupplier: null,
  supplierProducts: [],
  supplierManagers: [],
  loading: false,
  error: null,
  operationLoading: false,
};

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
    clearCurrentSupplier: (state) => {
      state.currentSupplier = null;
    },
    clearSupplierProducts: (state) => {
      state.supplierProducts = [];
    },
    clearSupplierManagers: (state) => {
      state.supplierManagers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSupplierProfile
      .addCase(fetchSupplierProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchSupplierProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createSupplier
      .addCase(createSupplier.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.profile = action.payload;
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      // updateSupplierProfile
      .addCase(updateSupplierProfile.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateSupplierProfile.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.profile = action.payload;
        // Actualizar también en la lista si existe
        const index = state.suppliers.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(updateSupplierProfile.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      // fetchAllSuppliers
      .addCase(fetchAllSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchAllSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchSupplierById
      .addCase(fetchSupplierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteSupplier
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter(s => s.id !== action.payload);
        if (state.profile?.id === action.payload) {
          state.profile = null;
        }
      })
      // verify/suspend/activate Supplier
      .addCase(verifySupplier.fulfilled, (state, action) => {
        const updatedSupplier = action.payload;
        state.suppliers = state.suppliers.map(s => 
          s.id === updatedSupplier.id ? updatedSupplier : s
        );
        if (state.profile?.id === updatedSupplier.id) {
          state.profile = updatedSupplier;
        }
      })
      .addCase(suspendSupplier.fulfilled, (state, action) => {
        const updatedSupplier = action.payload;
        state.suppliers = state.suppliers.map(s => 
          s.id === updatedSupplier.id ? updatedSupplier : s
        );
        if (state.profile?.id === updatedSupplier.id) {
          state.profile = updatedSupplier;
        }
      })
      .addCase(activateSupplier.fulfilled, (state, action) => {
        const updatedSupplier = action.payload;
        state.suppliers = state.suppliers.map(s => 
          s.id === updatedSupplier.id ? updatedSupplier : s
        );
        if (state.profile?.id === updatedSupplier.id) {
          state.profile = updatedSupplier;
        }
      })
      // fetchSupplierProducts
      .addCase(fetchSupplierProducts.fulfilled, (state, action) => {
        state.supplierProducts = action.payload;
      })
      // fetchSupplierManagers
      .addCase(fetchSupplierManagers.fulfilled, (state, action) => {
        state.supplierManagers = action.payload;
      })
      // addSupplierManager
      .addCase(addSupplierManager.fulfilled, (state, action) => {
        state.supplierManagers.push(action.payload);
      })
      // removeSupplierManager
      .addCase(removeSupplierManager.fulfilled, (state, action) => {
        state.supplierManagers = state.supplierManagers.filter(
          manager => manager.userId !== action.payload.managerUserId
        );
      });
  },
});

export const { 
  clearError, 
  clearProfile, 
  clearCurrentSupplier, 
  clearSupplierProducts, 
  clearSupplierManagers 
} = suppliersSlice.actions;

export default suppliersSlice.reducer;