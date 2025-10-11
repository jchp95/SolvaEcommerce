// api/endpoints/products.jsx
import apiClient from '../client';

export const ProductService = {
    getAll: () =>
        apiClient.get('/products')
            .then(response => response.data),

    getById: (id) =>
        apiClient.get(`/products/${id}`)
            .then(response => response.data),

    checkExists: (name, currentId = null) =>
        apiClient.get('/products/check-exists', {
            params: { name, currentId }
        }).then(response => response.data),

    create: (data) => {
        const formData = new FormData();

        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('stock', data.stock);
        formData.append('categoryId', data.categoryId);
        formData.append('identityId', data.identityId);

        if (data.imageFile) {
            formData.append('imageFile', data.imageFile); // <- clave para el backend
        }

        return apiClient.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response.data); // <- { success, message, data }
    },

    update: (id, data) => {
        const formData = new FormData();
        formData.append('id', id); // ← Necesario si el modelo Product lo incluye
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('stock', data.stock);
        formData.append('categoryId', data.categoryId);
        formData.append('identityId', data.identityId);
        if (data.imageFile) {
            formData.append('imageFile', data.imageFile);
        }

        return apiClient.put(`/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => response.data);
    },

    delete: (id) =>
        apiClient.delete(`/products/${id}`)
            .then(response => response.data),
};

export const CategoryService = {
    getAll: () =>
        apiClient.get('/categories')
            .then(response => response.data),
};