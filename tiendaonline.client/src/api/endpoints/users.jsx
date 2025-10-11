import api from '../client';

export const UsersService = {
  getAll: () => api.get('/users')
    .then(response => response.data),

  update: (id, data) => api.put(`/users/${id}`, data)
    .then(response => response.data),
};
