import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../../../api/endpoints/products';

export const useProducts = () => {
    const queryClient = useQueryClient();

    const {
        data: response,
        isLoading,
        error,
        isError
    } = useQuery({
        queryKey: ['products'],
        queryFn: ProductService.getAll,
        select: (data) => data.data, // Extraemos solo el array de productos
        staleTime: 5 * 60 * 1000, // 5 minutos de caché
    });

    const createMutation = useMutation({
        mutationFn: (productData) => ProductService.create(productData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => ProductService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => ProductService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return {
        products: response || [], // Aseguramos que siempre sea un array
        isLoading,
        error,
        isError,
        createProduct: createMutation.mutateAsync,
        updateProduct: updateMutation.mutateAsync,
        deleteProduct: deleteMutation.mutateAsync,
    };
};