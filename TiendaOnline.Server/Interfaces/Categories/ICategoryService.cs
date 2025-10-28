using TiendaOnline.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TiendaOnline.Server.Interfaces.Categories
{
    public interface ICategoryService
    {
        Task<ApiResponse<IEnumerable<Category>>> GetAllCategoriesAsync();
        Task<ApiResponse<Category>> GetCategoryByIdAsync(int id);
        Task<ApiResponse<Category>> CreateCategoryAsync(Category category);
        Task<ApiResponse<bool>> CheckCategoryExistsAsync(string name, int? currentId = null);
        Task<ApiResponse<Category>> UpdateCategoryAsync(int id, Category category);
        Task<ApiResponse<int>> DeleteCategoryAsync(int id);
        Task<bool> CategoryExistsAsync(int id);
        Task<ApiResponse<IEnumerable<Category>>> GetCategoriesByLevelAsync(int? parentId = null);
        Task<ApiResponse<IEnumerable<Category>>> SearchCategoriesAsync(string searchTerm);
    }
}