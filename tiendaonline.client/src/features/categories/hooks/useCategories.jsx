// features/categories/hooks/useCategories.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryService } from '../../../api/endpoints/categories';

export const useCategories = () => {
    const queryClient = useQueryClient();

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: CategoryService.getAll,
    });

    // NUEVOS QUERIES
    const useCategoriesByLevel = (parentId = null) => 
        useQuery({
            queryKey: ['categories', 'level', parentId],
            queryFn: () => CategoryService.getByLevel(parentId),
            enabled: parentId !== undefined,
        });

    const useSearchCategories = (searchTerm) => 
        useQuery({
            queryKey: ['categories', 'search', searchTerm],
            queryFn: () => CategoryService.search(searchTerm),
            enabled: !!searchTerm && searchTerm.length >= 2,
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
        // NUEVAS FUNCIONALIDADES EXPORTADAS
        useCategoriesByLevel,
        useSearchCategories,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
    };
};