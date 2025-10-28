import apiClient from '../client';

// Función para obtener o crear sessionId
const getSessionId = () => {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        sessionId = `session_${timestamp}_${randomString}`;
        sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
};

export const OrderService = {
    // Crear orden desde el carrito (checkout)
    createFromCart: async (orderData) => {
        try {
            const response = await apiClient.post('/orders/checkout', orderData, {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    // Obtener orden por ID
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/orders/${id}`, {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching order:", error);
            throw error;
        }
    },

    // Obtener mis órdenes
    getMyOrders: async () => {
        try {
            const response = await apiClient.get('/orders/my-orders', {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching my orders:", error);
            throw error;
        }
    },

    // Verificar si se puede cancelar una orden
    canCancelOrder: async (orderId) => {
        try {
            const response = await apiClient.get(`/orders/${orderId}/can-cancel`, {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error checking if order can be cancelled:", error);
            throw error;
        }
    },

    // Cancelar una orden
    cancelOrder: async (orderId, cancellationData) => {
        try {
            const response = await apiClient.post(`/orders/${orderId}/cancel`, cancellationData, {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error cancelling order:", error);
            throw error;
        }
    },

    // SUPPLIER MANAGEMENT ENDPOINTS

    // Obtener órdenes para gestión (Admin/Supplier)
    getOrdersForManagement: async () => {
        try {
            const response = await apiClient.get('/orders/manage', {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching orders for management:", error);
            throw error;
        }
    },

    // Actualizar orden (Admin/Supplier)
    updateOrder: async (orderId, updateData) => {
        try {
            const response = await apiClient.put(`/orders/${orderId}/update`, updateData, {
                headers: {
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating order:", error);
            throw error;
        }
    },

    // Función de utilidad para obtener el sessionId
    getSessionId
};
