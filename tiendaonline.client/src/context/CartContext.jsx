/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItemService } from '../api/endpoints/cartItems';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const loadCartItems = useCallback(async () => {
        try {
            const response = await CartItemService.getAll();
            if (response?.success && Array.isArray(response.data)) {
                setCartItems(response.data);
            }
        } catch (error) {
            console.error("Error al cargar el carrito:", error);
        }
    }, []);


    const addItem = async (item) => {
        try {
            const response = await CartItemService.create(item);
            if (response?.success) {
                await loadCartItems(); // recargar después de agregar
            }
        } catch (error) {
            console.error("Error al agregar al carrito:", error);
        }
    };

    const removeItem = async (id) => {
        try {
            await CartItemService.delete(id);
            setCartItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error al eliminar del carrito:", error);
        }
    };

    const updateQuantity = async (id, newQuantity) => {
        if (newQuantity < 1) return; // O podrías eliminar el item
        try {
            const response = await CartItemService.update(id, { quantity: newQuantity });
            if (response?.success) {
                await loadCartItems();
            }
        } catch (error) {
            console.error("Error al actualizar cantidad:", error);
        }
    };

    const clearCart = async () => {
        try {
            const response = await CartItemService.clear(); // Debes implementar esto en tu API
            if (response?.success) {
                setCartItems([]); // limpiar local
            }
        } catch (error) {
            console.error("Error al vaciar el carrito:", error);
        }
    };

    useEffect(() => {
        loadCartItems();
    }, []);

    return (
        <CartContext.Provider value={{ cartItems, addItem, removeItem, loadCartItems, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
