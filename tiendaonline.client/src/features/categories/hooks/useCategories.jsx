// features/categories/hooks/useCategories.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryService } from '../../../api/endpoints/categories';

export const useCategories = () => {
    const queryClient = useQueryClient();

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: CategoryService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: CategoryService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => CategoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => CategoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    return {
        categories,
        isLoading,
        error,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
    };
};