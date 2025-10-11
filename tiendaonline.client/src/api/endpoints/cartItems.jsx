import apiClient from '../client';

export const CartItemService = {
    getAll: async () => {
        try {
            const response = await apiClient.get('/cartItems', {
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cart items:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await apiClient.get(`/cartItems/${id}`, {
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cart item:", error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const sessionId = sessionStorage.getItem("sessionId") || '';
            const response = await apiClient.post('/cartItems', data, {
                headers: {
                    'X-Session-Id': sessionId
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error adding to cart:", error);
            throw error;
        }
    },


    update: async (id, data) => {
        try {
            const response = await apiClient.put(`/cartItems/${id}`, data, {
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating cart item:", error);
            throw error;
        }
    },


    delete: async (id) => {
        try {
            const response = await apiClient.delete(`/cartItems/${id}`, {
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting cart item:", error);
            throw error;
        }
    },

    clear: async () => {
        try {
            const response = await apiClient.delete('/cartitems/clear', {
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error al limpiar el carrito:", error);
            return { success: false };
        }
    },

    getBySession: async (sessionId) => {
        try {
            const response = await apiClient.get('/cartItems', {
                params: { sessionId },
                headers: {
                    'X-Session-Id': sessionStorage.getItem("sessionId") || ''
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cart by session:", error);
            throw error;
        }
    }
};