using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtiene todas las categorías
        /// </summary>
        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Category>>>> GetCategories()
        {
            try
            {
                var categories = await _context.Categories.ToListAsync();
                return Ok(new ApiResponse<IEnumerable<Category>>(true, "Categorías obtenidas con éxito", categories));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener categorías: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Obtiene una categoría específica por ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> GetCategory(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);

                if (category == null)
                {
                    return NotFound(new ApiResponse<string>(false, $"Categoría con ID {id} no encontrada", null!));
                }

                return Ok(new ApiResponse<Category>(true, "Categoría obtenida con éxito", category));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener categoría: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Crea una nueva categoría
        /// </summary>
        [HttpPost]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> PostCategory(Category category)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.ToDictionary(
                        kvp => kvp.Key,
                        kvp => string.Join(", ", kvp.Value!.Errors.Select(e => e.ErrorMessage))
                    );

                    return BadRequest(new ApiResponse<Dictionary<string, string>>(
                        false,
                        "Datos de entrada inválidos",
                        errors));
                }

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCategory), new { id = category.Id },
                    new ApiResponse<Category>(true, "Categoría creada con éxito", category));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al crear categoría: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Verifica si una categoría ya existe (excluyendo una categoría específica)
        /// </summary>
        [HttpGet("check-exists")]
        [ProducesResponseType(200)]
        [ProducesResponseType(409)]
        public async Task<ActionResult<ApiResponse<bool>>> CheckCategoryExists(
            [FromQuery] string name,
            [FromQuery] int? currentId = null)
        {
            try
            {
                var query = _context.Categories
                    .Where(c => c.Name.ToLower() == name.ToLower());

                if (currentId.HasValue)
                {
                    query = query.Where(c => c.Id != currentId.Value);
                }

                var exists = await query.AnyAsync();

                if (exists)
                {
                    return Conflict(new ApiResponse<bool>(
                        false,
                        "Ya existe una categoría con este nombre",
                        true));
                }

                return Ok(new ApiResponse<bool>(
                    true,
                    "No existe categoría con este nombre",
                    false));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false,
                    $"Error al verificar categoría: {ex.Message}",
                    null!));
            }
        }

        /// <summary>
        /// Actualiza una categoría existente
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Category>>> PutCategory(int id, Category category)
        {
            try
            {
                if (id != category.Id)
                {
                    return BadRequest(new ApiResponse<string>(false, "ID de categoría no coincide", null!));
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.ToDictionary(
                        kvp => kvp.Key,
                        kvp => string.Join(", ", kvp.Value!.Errors.Select(e => e.ErrorMessage))
                    );

                    return BadRequest(new ApiResponse<Dictionary<string, string>>(
                        false,
                        "Datos de entrada inválidos",
                        errors));
                }

                _context.Entry(category).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CategoryExists(id))
                    {
                        return NotFound(new ApiResponse<string>(false, $"Categoría con ID {id} no encontrada", null!));
                    }
                    else
                    {
                        throw;
                    }
                }

                return Ok(new ApiResponse<Category>(true, "Categoría actualizada con éxito", category));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al actualizar categoría: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Elimina una categoría específica
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new ApiResponse<string>(false, $"Categoría con ID {id} no encontrada", null!));
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<int>(true, "Categoría eliminada con éxito", id));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al eliminar categoría: {ex.Message}", null!));
            }
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.Id == id);
        }
    }
}