import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { OrderService } from '../../../api/endpoints/orders';

// Estados iniciales
const initialState = {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    createOrderLoading: false,
    createOrderError: null,
    cancelLoading: false,
    cancelError: null,
    canCancelStatus: {}, // { orderId: { canCancel: boolean, message: string } }
    // Supplier management states
    managementOrders: [],
    managementLoading: false,
    managementError: null,
    updateLoading: false,
    updateError: null
};

// Thunk para obtener las órdenes del usuario
export const fetchMyOrders = createAsyncThunk(
    'orders/fetchMyOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await OrderService.getMyOrders();
            return response.data || response; // Manejar diferentes estructuras de respuesta
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al obtener las órdenes'
            );
        }
    }
);

// Thunk para obtener una orden específica por ID
export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await OrderService.getById(orderId);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al obtener la orden'
            );
        }
    }
);

// Thunk para crear una orden desde el carrito
export const createOrderFromCart = createAsyncThunk(
    'orders/createOrderFromCart',
    async (orderData, { rejectWithValue }) => {
        try {
            const response = await OrderService.createFromCart(orderData);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al crear la orden'
            );
        }
    }
);

// Thunk para verificar si se puede cancelar una orden
export const checkCanCancelOrder = createAsyncThunk(
    'orders/checkCanCancelOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await OrderService.canCancelOrder(orderId);
            return { orderId, canCancel: response.data, message: response.message };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al verificar si se puede cancelar la orden'
            );
        }
    }
);

// Thunk para cancelar una orden
export const cancelOrder = createAsyncThunk(
    'orders/cancelOrder',
    async ({ orderId, cancellationData }, { rejectWithValue }) => {
        try {
            const response = await OrderService.cancelOrder(orderId, cancellationData);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al cancelar la orden'
            );
        }
    }
);

// SUPPLIER MANAGEMENT THUNKS

// Thunk para obtener órdenes para gestión (Admin/Supplier)
export const fetchOrdersForManagement = createAsyncThunk(
    'orders/fetchOrdersForManagement',
    async (_, { rejectWithValue }) => {
        try {
            const response = await OrderService.getOrdersForManagement();
            return response.data || response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al obtener las órdenes para gestión'
            );
        }
    }
);

// Thunk para actualizar una orden (Admin/Supplier)
export const updateOrderManagement = createAsyncThunk(
    'orders/updateOrderManagement',
    async ({ orderId, updateData }, { rejectWithValue }) => {
        try {
            const response = await OrderService.updateOrder(orderId, updateData);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Error al actualizar la orden'
            );
        }
    }
);

// Slice de órdenes
const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        // Limpiar errores
        clearErrors: (state) => {
            state.error = null;
            state.createOrderError = null;
            state.cancelError = null;
        },
        
        // Limpiar orden actual
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        
        // Limpiar todas las órdenes
        clearOrders: (state) => {
            state.orders = [];
            state.currentOrder = null;
            state.error = null;
            state.createOrderError = null;
            state.cancelError = null;
            state.canCancelStatus = {};
        },
        
        // Actualizar estado de una orden específica (para actualizaciones en tiempo real)
        updateOrderStatus: (state, action) => {
            const { orderId, status, paymentStatus, shippingStatus } = action.payload;
            const order = state.orders.find(o => o.id === orderId);
            if (order) {
                if (status) order.status = status;
                if (paymentStatus) order.paymentStatus = paymentStatus;
                if (shippingStatus) order.shippingStatus = shippingStatus;
            }
            
            // También actualizar si es la orden actual
            if (state.currentOrder && state.currentOrder.id === orderId) {
                if (status) state.currentOrder.status = status;
                if (paymentStatus) state.currentOrder.paymentStatus = paymentStatus;
                if (shippingStatus) state.currentOrder.shippingStatus = shippingStatus;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Obtener mis órdenes
            .addCase(fetchMyOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
                state.error = null;
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Obtener orden por ID
            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
                state.error = null;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Crear orden desde carrito
            .addCase(createOrderFromCart.pending, (state) => {
                state.createOrderLoading = true;
                state.createOrderError = null;
            })
            .addCase(createOrderFromCart.fulfilled, (state, action) => {
                state.createOrderLoading = false;
                state.currentOrder = action.payload;
                // Agregar la nueva orden al principio de la lista
                state.orders = [action.payload, ...state.orders];
                state.createOrderError = null;
            })
            .addCase(createOrderFromCart.rejected, (state, action) => {
                state.createOrderLoading = false;
                state.createOrderError = action.payload;
            })
            
            // Verificar si se puede cancelar una orden
            .addCase(checkCanCancelOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkCanCancelOrder.fulfilled, (state, action) => {
                state.loading = false;
                const { orderId, canCancel, message } = action.payload;
                state.canCancelStatus[orderId] = { canCancel, message };
                state.error = null;
            })
            .addCase(checkCanCancelOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Cancelar orden
            .addCase(cancelOrder.pending, (state) => {
                state.cancelLoading = true;
                state.cancelError = null;
            })
            .addCase(cancelOrder.fulfilled, (state, action) => {
                state.cancelLoading = false;
                const cancelledOrder = action.payload;
                
                // Actualizar la orden en la lista
                const orderIndex = state.orders.findIndex(o => o.id === cancelledOrder.id);
                if (orderIndex !== -1) {
                    state.orders[orderIndex] = cancelledOrder;
                }
                
                // Actualizar la orden actual si coincide
                if (state.currentOrder && state.currentOrder.id === cancelledOrder.id) {
                    state.currentOrder = cancelledOrder;
                }
                
                // Limpiar el estado de cancelación para esta orden
                delete state.canCancelStatus[cancelledOrder.id];
                state.cancelError = null;
            })
            .addCase(cancelOrder.rejected, (state, action) => {
                state.cancelLoading = false;
                state.cancelError = action.payload;
            })
            
            // Obtener órdenes para gestión
            .addCase(fetchOrdersForManagement.pending, (state) => {
                state.managementLoading = true;
                state.managementError = null;
            })
            .addCase(fetchOrdersForManagement.fulfilled, (state, action) => {
                state.managementLoading = false;
                state.managementOrders = action.payload;
                state.managementError = null;
            })
            .addCase(fetchOrdersForManagement.rejected, (state, action) => {
                state.managementLoading = false;
                state.managementError = action.payload;
            })
            
            // Actualizar orden para gestión
            .addCase(updateOrderManagement.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updateOrderManagement.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updatedOrder = action.payload;
                
                // Actualizar la orden en la lista de gestión
                const orderIndex = state.managementOrders.findIndex(o => o.id === updatedOrder.id);
                if (orderIndex !== -1) {
                    state.managementOrders[orderIndex] = updatedOrder;
                }
                
                // También actualizar en la lista regular si existe
                const regularOrderIndex = state.orders.findIndex(o => o.id === updatedOrder.id);
                if (regularOrderIndex !== -1) {
                    state.orders[regularOrderIndex] = updatedOrder;
                }
                
                // Actualizar la orden actual si coincide
                if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
                    state.currentOrder = updatedOrder;
                }
                
                state.updateError = null;
            })
            .addCase(updateOrderManagement.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            });
    }
});

// Exportar acciones
export const { 
    clearErrors, 
    clearCurrentOrder, 
    clearOrders, 
    updateOrderStatus 
} = ordersSlice.actions;

// Selectores útiles
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersError = (state) => state.orders.error;
export const selectCreateOrderLoading = (state) => state.orders.createOrderLoading;
export const selectCreateOrderError = (state) => state.orders.createOrderError;
export const selectCancelLoading = (state) => state.orders.cancelLoading;
export const selectCancelError = (state) => state.orders.cancelError;
export const selectCanCancelStatus = (state) => state.orders.canCancelStatus;

// Selectores para gestión de órdenes (Supplier)
export const selectManagementOrders = (state) => state.orders.managementOrders;
export const selectManagementLoading = (state) => state.orders.managementLoading;
export const selectManagementError = (state) => state.orders.managementError;
export const selectUpdateLoading = (state) => state.orders.updateLoading;
export const selectUpdateError = (state) => state.orders.updateError;

// Selectores avanzados
export const selectOrderById = (orderId) => (state) => 
    state.orders.orders.find(order => order.id === orderId);

export const selectOrdersByStatus = (status) => (state) => 
    state.orders.orders.filter(order => order.status === status);

export const selectRecentOrders = (limit = 5) => (state) => 
    state.orders.orders
        .slice()
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, limit);

export const selectCanCancelOrderById = (orderId) => (state) => 
    state.orders.canCancelStatus[orderId] || { canCancel: false, message: 'No verificado' };

// Exportar el reducer
export default ordersSlice.reducer;
