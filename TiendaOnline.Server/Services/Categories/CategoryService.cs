using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Interfaces.Categories;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Services.Categories
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;

        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<IEnumerable<Category>>> GetAllCategoriesAsync()
        {
            try
            {
                // OPTIMIZADO: Usar Include para cargar relaciones necesarias
                var categories = await _context.Categories
                    .Include(c => c.ParentCategory) // Incluir categoría padre
                    .Include(c => c.SubCategories) // Incluir subcategorías
                    .Include(c => c.ProductCategories) // Incluir relación con productos
                        .ThenInclude(pc => pc.Product) // Incluir productos relacionados
                    .Include(c => c.ServiceCategories) // Incluir relación con servicios
                        .ThenInclude(sc => sc.Service) // Incluir servicios relacionados
                    .Where(c => c.IsActive) // Filtrar solo categorías activas
                    .OrderBy(c => c.DisplayOrder)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                return new ApiResponse<IEnumerable<Category>>(true, "Categorías obtenidas con éxito", categories);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<IEnumerable<Category>>(false, $"Error al obtener categorías: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<Category>> GetCategoryByIdAsync(int id)
        {
            try
            {
                // OPTIMIZADO: Usar Include para cargar todas las relaciones necesarias
                var category = await _context.Categories
                    .Include(c => c.ParentCategory) // Categoría padre
                    .Include(c => c.SubCategories) // Subcategorías
                        .ThenInclude(sc => sc.ProductCategories) // Productos de subcategorías
                    .Include(c => c.ProductCategories) // Productos de esta categoría
                        .ThenInclude(pc => pc.Product)
                    .Include(c => c.ServiceCategories) // Servicios de esta categoría
                        .ThenInclude(sc => sc.Service)
                    .Include(c => c.Products) // Productos directos (si los hay)
                    .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

                if (category == null)
                {
                    return new ApiResponse<Category>(false, $"Categoría con ID {id} no encontrada", null);
                }

                return new ApiResponse<Category>(true, "Categoría obtenida con éxito", category);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<Category>(false, $"Error al obtener categoría: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<Category>> CreateCategoryAsync(Category category)
        {
            try
            {
                // Validar si ya existe una categoría con el mismo nombre
                var exists = await _context.Categories
                    .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower().Trim() && c.IsActive);

                if (exists)
                {
                    return new ApiResponse<Category>(false, "Ya existe una categoría con este nombre", null);
                }

                // Validar ParentCategoryId si se proporciona
                if (category.ParentCategoryId.HasValue)
                {
                    var parentExists = await _context.Categories
                        .AnyAsync(c => c.Id == category.ParentCategoryId.Value && c.IsActive);
                    
                    if (!parentExists)
                    {
                        return new ApiResponse<Category>(false, "La categoría padre especificada no existe", null);
                    }
                }

                // Asignar valores por defecto
                category.CreatedAt = System.DateTime.UtcNow;
                category.IsActive = true;
                
                // Asegurar que el slug esté limpio
                if (!string.IsNullOrEmpty(category.Slug))
                {
                    category.Slug = category.Slug.Trim().ToLower();
                }

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return new ApiResponse<Category>(true, "Categoría creada con éxito", category);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<Category>(false, $"Error al crear categoría: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<bool>> CheckCategoryExistsAsync(string name, int? currentId = null)
        {
            try
            {
                // OPTIMIZADO: Usar consulta más eficiente
                var query = _context.Categories
                    .Where(c => c.Name.ToLower() == name.ToLower().Trim() && c.IsActive);

                if (currentId.HasValue)
                {
                    query = query.Where(c => c.Id != currentId.Value);
                }

                var exists = await query.AnyAsync();

                return new ApiResponse<bool>(true, 
                    exists ? "Ya existe una categoría con este nombre" : "No existe categoría con este nombre", 
                    exists);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<bool>(false, $"Error al verificar categoría: {ex.Message}", false);
            }
        }

        public async Task<ApiResponse<Category>> UpdateCategoryAsync(int id, Category category)
        {
            try
            {
                if (id != category.Id)
                {
                    return new ApiResponse<Category>(false, "ID de categoría no coincide", null);
                }

                // Verificar si la categoría existe
                var existingCategory = await _context.Categories
                    .Include(c => c.SubCategories)
                    .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

                if (existingCategory == null)
                {
                    return new ApiResponse<Category>(false, $"Categoría con ID {id} no encontrada", null);
                }

                // Verificar si el nuevo nombre ya existe en otra categoría
                var nameExists = await _context.Categories
                    .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower().Trim() && 
                                  c.Id != id && 
                                  c.IsActive);

                if (nameExists)
                {
                    return new ApiResponse<Category>(false, "Ya existe otra categoría con este nombre", null);
                }

                // Validar que no se asigne a sí misma como padre
                if (category.ParentCategoryId == id)
                {
                    return new ApiResponse<Category>(false, "Una categoría no puede ser padre de sí misma", null);
                }

                // Validar ParentCategoryId si se proporciona
                if (category.ParentCategoryId.HasValue)
                {
                    var parentExists = await _context.Categories
                        .AnyAsync(c => c.Id == category.ParentCategoryId.Value && c.IsActive);
                    
                    if (!parentExists)
                    {
                        return new ApiResponse<Category>(false, "La categoría padre especificada no existe", null);
                    }

                    // Verificar que no se cree un ciclo en la jerarquía
                    if (await CreatesCircularReference(id, category.ParentCategoryId.Value))
                    {
                        return new ApiResponse<Category>(false, "No se puede crear una referencia circular en la jerarquía de categorías", null);
                    }
                }

                // Actualizar propiedades
                existingCategory.Name = category.Name.Trim();
                existingCategory.Description = category.Description?.Trim();
                existingCategory.Slug = category.Slug?.Trim().ToLower();
                existingCategory.ParentCategoryId = category.ParentCategoryId;
                existingCategory.DisplayOrder = category.DisplayOrder;
                existingCategory.Image = category.Image;
                existingCategory.Icon = category.Icon;
                existingCategory.MetaTitle = category.MetaTitle?.Trim();
                existingCategory.MetaDescription = category.MetaDescription?.Trim();
                existingCategory.UpdatedAt = System.DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<Category>(true, "Categoría actualizada con éxito", existingCategory);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await CategoryExistsAsync(id))
                {
                    return new ApiResponse<Category>(false, $"Categoría con ID {id} no encontrada", null);
                }
                else
                {
                    throw;
                }
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<Category>(false, $"Error al actualizar categoría: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<int>> DeleteCategoryAsync(int id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.SubCategories)
                    .Include(c => c.ProductCategories)
                        .ThenInclude(pc => pc.Product)
                    .Include(c => c.ServiceCategories)
                    .FirstOrDefaultAsync(c => c.Id == id);

                // Verificar productos asociados (a través de ProductCategories)
                var hasProducts = category.ProductCategories
                    .Any(pc => pc.Product != null && pc.Product.IsPublished);
                
                if (hasProducts)
                {
                    return new ApiResponse<int>(false, 
                        "No se puede eliminar la categoría porque tiene productos asociados", id);
                }

                if (category == null)
                {
                    return new ApiResponse<int>(false, $"Categoría con ID {id} no encontrada", id);
                }

                // Verificar si tiene subcategorías activas
                if (category.SubCategories != null && category.SubCategories.Any(sc => sc.IsActive))
                {
                    return new ApiResponse<int>(false, "No se puede eliminar la categoría porque tiene subcategorías activas asociadas", id);
                }

                // Verificar si tiene productos asociados
                if (category.ProductCategories.Any() || (category.Products != null && category.Products.Any()))
                {
                    return new ApiResponse<int>(false, "No se puede eliminar la categoría porque tiene productos asociados", id);
                }

                // Verificar si tiene servicios asociados
                if (category.ServiceCategories.Any())
                {
                    return new ApiResponse<int>(false, "No se puede eliminar la categoría porque tiene servicios asociados", id);
                }

                // Eliminación suave (soft delete) - marcando como inactiva
                category.IsActive = false;
                category.UpdatedAt = System.DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<int>(true, "Categoría eliminada con éxito", id);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<int>(false, $"Error al eliminar categoría: {ex.Message}", id);
            }
        }

        public async Task<bool> CategoryExistsAsync(int id)
        {
            return await _context.Categories.AnyAsync(e => e.Id == id && e.IsActive);
        }

        // Método auxiliar para verificar referencias circulares
        private async Task<bool> CreatesCircularReference(int categoryId, int parentId)
        {
            int? currentParentId = parentId; // Convertir a nullable para el bucle
            var visited = new HashSet<int> { categoryId };

            while (currentParentId.HasValue)
            {
                if (visited.Contains(currentParentId.Value))
                {
                    return true; // Se encontró un ciclo
                }

                visited.Add(currentParentId.Value);
                
                var parent = await _context.Categories
                    .Where(c => c.Id == currentParentId.Value && c.IsActive)
                    .Select(c => new { c.ParentCategoryId })
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    break;
                }

                currentParentId = parent.ParentCategoryId;
            }

            return false;
        }

        // Método adicional para obtener categorías por nivel (opcional)
        public async Task<ApiResponse<IEnumerable<Category>>> GetCategoriesByLevelAsync(int? parentId = null)
        {
            try
            {
                var categories = await _context.Categories
                    .Where(c => c.ParentCategoryId == parentId && c.IsActive)
                    .Include(c => c.SubCategories)
                    .OrderBy(c => c.DisplayOrder)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                return new ApiResponse<IEnumerable<Category>>(true, "Categorías obtenidas con éxito", categories);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<IEnumerable<Category>>(false, $"Error al obtener categorías: {ex.Message}", null);
            }
        }

        // Método adicional para buscar categorías por nombre (opcional)
        public async Task<ApiResponse<IEnumerable<Category>>> SearchCategoriesAsync(string searchTerm)
        {
            try
            {
                var categories = await _context.Categories
                    .Where(c => c.IsActive && 
                               (c.Name.Contains(searchTerm) || 
                                c.Description.Contains(searchTerm) ||
                                (c.MetaTitle != null && c.MetaTitle.Contains(searchTerm)) ||
                                (c.MetaDescription != null && c.MetaDescription.Contains(searchTerm))))
                    .Include(c => c.ParentCategory)
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return new ApiResponse<IEnumerable<Category>>(true, "Categorías encontradas con éxito", categories);
            }
            catch (System.Exception ex)
            {
                return new ApiResponse<IEnumerable<Category>>(false, $"Error al buscar categorías: {ex.Message}", null);
            }
        }
    }
}