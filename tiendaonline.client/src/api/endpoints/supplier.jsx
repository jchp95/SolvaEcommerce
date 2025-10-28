// api/endpoints/supplier.js
import apiClient from '../client';

export const SupplierService = {
  // Obtener todos los proveedores (para admin)
  getAll: () =>
    apiClient.get('/Suppliers')
      .then(response => response.data),

  // Crear nuevo proveedor
  create: (formData) =>
    apiClient.post('/Suppliers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => response.data),

  // Obtener proveedor por ID
  getById: (id) =>
    apiClient.get(`/Suppliers/${id}`)
      .then(response => response.data),

  // Actualizar proveedor
  update: (id, supplierData) =>
    apiClient.put(`/Suppliers/${id}`, supplierData, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => response.data),

  // Eliminar proveedor
  delete: (id) =>
    apiClient.delete(`/Suppliers/${id}`)
      .then(response => response.data),

  // Obtener el proveedor del usuario actual
   getMySupplier: () =>
    apiClient.get('/Suppliers/my-supplier')
      .then(response => {
        console.log('Supplier API Response:', response.data); // Para debug
        return response.data.data; // Acceder a response.data.data
      }),

  // Verificar si existe un proveedor
  checkExists: (companyName, currentId = null) =>
    apiClient.get('/Suppliers/check-exists', {
      params: { companyName, currentId }
    }).then(response => response.data),

  // Obtener proveedores activos
  getActive: () =>
    apiClient.get('/Suppliers/active')
      .then(response => response.data),

  // Buscar proveedores
  search: (searchTerm) =>
    apiClient.get('/Suppliers/search', {
      params: { searchTerm }
    }).then(response => response.data),

  // Verificar proveedor (admin)
  verify: (id) =>
    apiClient.post(`/Suppliers/${id}/verify`)
      .then(response => response.data),

  // Suspender proveedor (admin)
  suspend: (id) =>
    apiClient.post(`/Suppliers/${id}/suspend`)
      .then(response => response.data),

  // Activar proveedor (admin)
  activate: (id) =>
    apiClient.post(`/Suppliers/${id}/activate`)
      .then(response => response.data),

  // Obtener productos del proveedor
  getProducts: (supplierId) =>
    apiClient.get(`/Suppliers/${supplierId}/products`)
      .then(response => response.data),

  // Obtener managers del proveedor
  getManagers: (supplierId) =>
    apiClient.get(`/Suppliers/${supplierId}/managers`)
      .then(response => response.data),

  // Agregar manager al proveedor
  addManager: (supplierId, managerData) =>
    apiClient.post(`/Suppliers/${supplierId}/managers`, managerData)
      .then(response => response.data),

  // Eliminar manager del proveedor
  removeManager: (supplierId, managerUserId) =>
    apiClient.delete(`/Suppliers/${supplierId}/managers/${managerUserId}`)
      .then(response => response.data),
};