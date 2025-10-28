import apiClient from '../client';

export const CategoryService = {
    getAll: () =>
        apiClient.get('/categories')
            .then(response => response.data),

    getById: (id) =>
        apiClient.get(`/categories/${id}`)
            .then(response => response.data),

    // NUEVOS MÉTODOS
    getByLevel: (parentId = null) =>
        apiClient.get('/categories/level', {
            params: { parentId }
        }).then(response => response.data),

    search: (term) =>
        apiClient.get('/categories/search', {
            params: { term }
        }).then(response => response.data),

    checkExists: (name, currentId = null) =>
        apiClient.get('/categories/check-exists', {
            params: { name, currentId }
        }).then(response => response.data),

    create: (data) =>
        apiClient.post('/categories', data)
            .then(response => response.data),

    update: (id, data) =>
        apiClient.put(`/categories/${id}`, data)
            .then(response => response.data),

    delete: (id) =>
        apiClient.delete(`/categories/${id}`)
            .then(response => response.data),
};