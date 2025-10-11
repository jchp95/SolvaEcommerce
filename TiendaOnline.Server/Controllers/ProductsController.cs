using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProductsController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        /// <summary>
        /// Obtiene todos los productos
        /// </summary>
        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductReadDto>>>> GetProducts()
        {
            try
            {
                var products = await (from product in _context.Products
                                      join category in _context.Categories
                                          on product.CategoryId equals category.Id
                                      select new ProductReadDto
                                      {
                                          Id = product.Id,
                                          Name = product.Name,
                                          Description = product.Description,
                                          Price = product.Price,
                                          Stock = product.Stock,
                                          CategoryId = product.CategoryId,
                                          CategoryName = category.Name,
                                          ImageUrl = product.ImageUrl,
                                          IdentityId = product.IdentityId
                                      }).ToListAsync();

                return Ok(new ApiResponse<IEnumerable<ProductReadDto>>(true, "Productos obtenidos con éxito", products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener productos: {ex.Message}", null!));
            }
        }


        /// <summary>
        /// Obtiene un producto específico por ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> GetProduct(int id)
        {
            try
            {
                var product = await (from p in _context.Products
                                     join c in _context.Categories
                                         on p.CategoryId equals c.Id
                                     where p.Id == id
                                     select new ProductReadDto
                                     {
                                         Id = p.Id,
                                         Name = p.Name,
                                         Description = p.Description,
                                         Price = p.Price,
                                         Stock = p.Stock,
                                         CategoryId = p.CategoryId,
                                         CategoryName = c.Name,
                                         ImageUrl = p.ImageUrl,
                                         IdentityId = p.IdentityId
                                     }).FirstOrDefaultAsync();

                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(false, $"Producto con ID {id} no encontrado", null!));
                }

                return Ok(new ApiResponse<ProductReadDto>(true, "Producto obtenido con éxito", product));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener producto: {ex.Message}", null!));
            }
        }


        /// <summary>
        /// Crea un nuevo producto (con opción para subir imagen)
        /// </summary>
        [HttpPost]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> PostProduct(ProductCreateDto productDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponse<Dictionary<string, string>>(
                    false, "Datos inválidos", ModelState.ToDictionary(
                        kvp => kvp.Key,
                        kvp => string.Join(", ", kvp.Value!.Errors.Select(e => e.ErrorMessage)))));

            if (!await _context.Categories.AnyAsync(c => c.Id == productDto.CategoryId))
                return BadRequest(new ApiResponse<string>(false, "Categoría no existe", null!));

            var product = new Product
            {
                Name = productDto.Name,
                Description = productDto.Description,
                Price = productDto.Price,
                Stock = productDto.Stock,
                CategoryId = productDto.CategoryId,
                IdentityId = productDto.IdentityId
            };

            if (productDto.ImageFile != null)
            {
                var uploadResult = await UploadImage(productDto.ImageFile);
                product.ImageUrl = uploadResult.Url;
                product.ImageFileName = uploadResult.FileName;
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var categoryName = await _context.Categories
                .Where(c => c.Id == product.CategoryId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            var result = new ProductReadDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                CategoryName = categoryName!,
                ImageUrl = product.ImageUrl,
                IdentityId = product.IdentityId
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id },
                new ApiResponse<ProductReadDto>(true, "Producto creado", result));
        }

        private async Task<(string Url, string FileName)> UploadImage(IFormFile imageFile)
        {
            // Verificar si el archivo es válido
            if (imageFile == null || imageFile.Length == 0)
            {
                throw new ArgumentException("El archivo de imagen no es válido");
            }

            // Crear directorio wwwroot si no existe
            var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            if (!Directory.Exists(wwwrootPath))
            {
                Directory.CreateDirectory(wwwrootPath);
            }

            // Directorio para guardar imágenes
            var uploadsFolder = Path.Combine(wwwrootPath, "uploads", "products");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Nombre único para el archivo
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(imageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Guardar el archivo
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            // Retornar URL relativa y nombre del archivo
            return ($"/uploads/products/{uniqueFileName}", uniqueFileName);
        }

        /// <summary>
        /// Verifica si un producto ya existe (excluyendo un producto específico)
        /// </summary>
        [HttpGet("check-exists")]
        [ProducesResponseType(200)]
        [ProducesResponseType(409)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<bool>>> CheckProductExists(
            [FromQuery] string name,
            [FromQuery] int? currentId = null)
        {
            try
            {
                var query = _context.Products
                    .Where(p => p.Name.ToLower() == name.ToLower());

                if (currentId.HasValue)
                {
                    query = query.Where(p => p.Id != currentId.Value);
                }

                var exists = await query.AnyAsync();

                if (exists)
                {
                    return Conflict(new ApiResponse<bool>(
                        false,
                        "Ya existe un producto con este nombre",
                        true));
                }

                return Ok(new ApiResponse<bool>(
                    true,
                    "No existe producto con este nombre",
                    false));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false,
                    $"Error al verificar producto: {ex.Message}",
                    null!));
            }
        }

        /// <summary>
        /// Actualiza un producto existente
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> PutProduct(int id, [FromForm] ProductUpdateDto productDto)
        {
            if (id != productDto.Id)
            {
                return BadRequest(new ApiResponse<string>(false, "ID de producto no coincide", null!));
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

            if (!await _context.Categories.AnyAsync(c => c.Id == productDto.CategoryId))
            {
                return BadRequest(new ApiResponse<string>(false, "La categoría especificada no existe", null!));
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new ApiResponse<string>(false, $"Producto con ID {id} no encontrado", null!));
            }

            // Actualizar propiedades
            product.Name = productDto.Name;
            product.Description = productDto.Description;
            product.Price = productDto.Price;
            product.Stock = productDto.Stock;
            product.CategoryId = productDto.CategoryId;
            product.IdentityId = productDto.IdentityId;

            if (productDto.ImageFile != null)
            {
                // Eliminar imagen anterior si existe
                if (!string.IsNullOrEmpty(product.ImageFileName))
                {
                    var imagePath = Path.Combine(_environment.WebRootPath, "uploads", "products", product.ImageFileName);
                    if (System.IO.File.Exists(imagePath))
                    {
                        System.IO.File.Delete(imagePath);
                    }
                }

                var uploadResult = await UploadImage(productDto.ImageFile);
                product.ImageUrl = uploadResult.Url;
                product.ImageFileName = uploadResult.FileName;
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<Product>(true, "Producto actualizado con éxito", product));
        }


        /// <summary>
        /// Elimina un producto específico
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(false, $"Producto con ID {id} no encontrado", null!));
                }

                // Eliminar la imagen asociada si existe
                if (!string.IsNullOrEmpty(product.ImageFileName))
                {
                    var imagePath = Path.Combine(_environment.WebRootPath, "uploads", "products", product.ImageFileName);
                    if (System.IO.File.Exists(imagePath))
                    {
                        System.IO.File.Delete(imagePath);
                    }
                }

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<int>(true, "Producto eliminado con éxito", id));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al eliminar producto: {ex.Message}", null!));
            }
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}