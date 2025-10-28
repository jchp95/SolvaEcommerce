import apiClient from '../client';

// Función para generar un sessionId único
const generateSessionId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomString}`;
};

// Función para obtener o crear sessionId
const getSessionId = () => {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
};

export const CartItemService = {
    getAll: async () => {
        try {
            const response = await apiClient.get('/cartItems', {
                headers: {
                    'X-Session-Id': getSessionId()
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
                    'X-Session-Id': getSessionId()
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
            const response = await apiClient.post('/cartItems', data, {
                headers: {
                    'X-Session-Id': getSessionId()
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
                    'X-Session-Id': getSessionId()
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
                    'X-Session-Id': getSessionId()
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
            const response = await apiClient.delete('/cartItems/clear', {
                headers: {
                    'X-Session-Id': getSessionId()
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
                    'X-Session-Id': getSessionId()
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cart by session:", error);
            throw error;
        }
    }

    // Función de utilidad para obtener el sessionId
    ,getSessionId
};