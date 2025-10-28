using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using TiendaOnline.Server.Interfaces.Categories;
using TiendaOnline.Server.Models;
using TiendaOnline.Server.Services;

namespace TiendaOnline.Server.Controllers.Categories
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        /// <summary>
        /// Obtiene todas las categorías
        /// </summary>
        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Category>>>> GetCategories()
        {
            var result = await _categoryService.GetAllCategoriesAsync();
            
            if (!result.Success)
                return StatusCode(500, result);
                
            return Ok(result);
        }

        /// <summary>
        /// Obtiene una categoría específica por ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> GetCategory(int id)
        {
            var result = await _categoryService.GetCategoryByIdAsync(id);
            
            if (!result.Success)
                return NotFound(result);
                
            return Ok(result);
        }

        /// <summary>
        /// Obtiene categorías por nivel (padre)
        /// </summary>
        [HttpGet("level")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Category>>>> GetCategoriesByLevel(
            [FromQuery] int? parentId = null)
        {
            var result = await _categoryService.GetCategoriesByLevelAsync(parentId);
            
            if (!result.Success)
                return StatusCode(500, result);
                
            return Ok(result);
        }

        /// <summary>
        /// Busca categorías por término de búsqueda
        /// </summary>
        [HttpGet("search")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Category>>>> SearchCategories(
            [FromQuery] string term)
        {
            if (string.IsNullOrWhiteSpace(term))
            {
                return BadRequest(new ApiResponse<string>(false, "Término de búsqueda requerido", null));
            }

            var result = await _categoryService.SearchCategoriesAsync(term);
            
            if (!result.Success)
                return StatusCode(500, result);
                
            return Ok(result);
        }

        /// <summary>
        /// Crea una nueva categoría
        /// </summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> PostCategory(CategoryCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<string>(false, "Datos de entrada inválidos", null));
            }

            // Obtener el siguiente DisplayOrder automáticamente
            int nextDisplayOrder = 1;
            var allCategories = await _categoryService.GetAllCategoriesAsync();
            if (allCategories.Success && allCategories.Data != null && allCategories.Data.Any())
            {
                var maxDisplayOrder = allCategories.Data.Max(c => c.DisplayOrder);
                nextDisplayOrder = maxDisplayOrder + 1;
            }

            var category = new Category
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                DisplayOrder = nextDisplayOrder,
                ParentCategoryId = dto.ParentCategoryId,
                MetaTitle = dto.MetaTitle?.Trim() ?? string.Empty,
                MetaDescription = dto.MetaDescription?.Trim() ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow // Generar fecha actual en el backend
            };

            var result = await _categoryService.CreateCategoryAsync(category);

            if (!result.Success)
            {
                return BadRequest(new ApiResponse<Category>(false, result.Message, new Category()));
            }

            // Usar el ID de la categoría creada
            var categoryCreateDto = new CategoryCreateDto
            {
                Id = result.Data.Id, // Usar el ID generado
                Name = result.Data.Name,
                Description = result.Data.Description,
                DisplayOrder = result.Data.DisplayOrder,
                ParentCategoryId = result.Data.ParentCategoryId,
                MetaTitle = result.Data.MetaTitle,
                MetaDescription = result.Data.MetaDescription,
                IsActive = result.Data.IsActive,
                CreatedAt = result.Data.CreatedAt
            };

            return CreatedAtAction(nameof(GetCategory), new { id = categoryCreateDto.Id },
                new ApiResponse<CategoryCreateDto>(true, result.Message, categoryCreateDto));
        }

        /// <summary>
        /// Verifica si una categoría ya existe
        /// </summary>
        [HttpGet("check-exists")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(409)]
        public async Task<ActionResult<ApiResponse<bool>>> CheckCategoryExists(
            [FromQuery] string name,
            [FromQuery] int? currentId = null)
        {
            var result = await _categoryService.CheckCategoryExistsAsync(name, currentId);
            
            if (result.Data) // Si existe
                return Conflict(result);
                
            return Ok(result);
        }

        /// <summary>
        /// Actualiza una categoría existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> PutCategory(int id, Category category)
        {
            if (id != category.Id)
            {
                return BadRequest(new ApiResponse<string>(false, "ID de categoría no coincide", null));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<string>(false, "Datos de entrada inválidos", null));
            }

            var result = await _categoryService.UpdateCategoryAsync(id, category);
            
            if (!result.Success)
                return BadRequest(result);
                
            return Ok(result);
        }

        /// <summary>
        /// Elimina una categoría específica
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteCategory(int id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            
            if (!result.Success)
                return BadRequest(result);
                
            return Ok(result);
        }
    }
}