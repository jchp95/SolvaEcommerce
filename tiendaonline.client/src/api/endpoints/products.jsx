// api/endpoints/products.jsx
import apiClient from '../client';

export const ProductService = {
    getAll: () =>
        apiClient.get('/products')
            .then(response => response.data),

    getPublic: () =>
        apiClient.get('/products/public')
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
        formData.append('shortDescription', data.shortDescription || '');
        formData.append('price', data.price);
        formData.append('compareAtPrice', data.compareAtPrice || '');
        formData.append('stock', data.stock);
        formData.append('brand', data.brand);
        formData.append('sku', data.sku || '');
        formData.append('categoryId', data.categoryId);
        formData.append('identityId', data.identityId);
        formData.append('expiryDate', data.expiryDate || '');
        
        // Serializar arrays y objetos para FormData
        formData.append('features', JSON.stringify(data.features || []));
        formData.append('specs', JSON.stringify(data.specs || {}));
        formData.append('badges', JSON.stringify(data.badges || []));
        
        // Campos booleanos
        formData.append('isPublished', data.isPublished);
        formData.append('isFeatured', data.isFeatured);
        formData.append('hasFreeShipping', data.hasFreeShipping);

        if (data.imageFile) {
            formData.append('imageFile', data.imageFile);
        }

        return apiClient.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response.data); // <- { success, message, data }
    },

    update: (id, data) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('shortDescription', data.shortDescription || ''); // ¡FALTABA ESTE!
        formData.append('price', data.price);
        formData.append('compareAtPrice', data.compareAtPrice || ''); // ¡FALTABA ESTE!
        formData.append('stock', data.stock);
        formData.append('brand', data.brand);
        formData.append('sku', data.sku || ''); // ¡FALTABA ESTE!
        formData.append('categoryId', data.categoryId);
        formData.append('identityId', data.identityId);
        formData.append('expiryDate', data.expiryDate || '');
        
        // Serializar arrays y objetos para FormData
        formData.append('features', JSON.stringify(data.features || []));
        formData.append('specs', JSON.stringify(data.specs || {}));
        formData.append('badges', JSON.stringify(data.badges || []));
        
        // Campos booleanos
        formData.append('isPublished', data.isPublished);
        formData.append('isFeatured', data.isFeatured);
        formData.append('hasFreeShipping', data.hasFreeShipping);
      
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