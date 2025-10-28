import { useState, useEffect } from 'react';
import { ProductService } from '../../../api/endpoints/products';

export const usePublicProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Fetching public products...');
        const result = await ProductService.getPublic();
        console.log('📦 Public products response:', result);
        
        // Manejar el formato de respuesta del backend ApiResponse<T>
        if (result && result.success && Array.isArray(result.data)) {
          console.log('✅ Products loaded successfully:', result.data.length, 'products');
          setProducts(result.data);
        } else if (Array.isArray(result)) {
          console.log('✅ Products loaded (direct array):', result.length, 'products');
          setProducts(result);
        } else if (result && Array.isArray(result.data)) {
          console.log('✅ Products loaded (nested data):', result.data.length, 'products');
          setProducts(result.data);
        } else {
          console.warn('⚠️ Unexpected response format:', result);
          setProducts([]);
        }
      } catch (err) {
        console.error('❌ Error fetching public products:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.message || err.message || 'Error al cargar productos');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProducts();
  }, []);

  return {
    products,
    isLoading,
    error,
  };
};
