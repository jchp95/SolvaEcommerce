using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;
using TiendaOnline.Server.Services;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using System.Security.Claims;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IWebHostEnvironment _environment;
        private readonly MeiliProductIndexService _meiliService;
        private readonly ApplicationDbContext _context;

        public ProductsController(
            IProductService productService,
            IWebHostEnvironment environment,
            MeiliProductIndexService meiliService,
            ApplicationDbContext context)
        {
            _productService = productService;
            _environment = environment;
            _meiliService = meiliService;
            _context = context;
        }

        /// <summary>
        /// Obtiene productos publicados para la vista pública (Home) - Sin autenticación requerida
        /// </summary>
        [HttpGet("public")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductReadDto>>>> GetPublicProducts()
        {
            try
            {
                // Obtener solo productos publicados y con stock disponible
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Where(p => p.IsPublished && p.Stock > 0)
                    .OrderByDescending(p => p.IsFeatured) // Productos destacados primero
                    .ThenByDescending(p => p.CreatedAt)   // Luego por más recientes
                    .Take(20) // Limitar a 20 productos para la vista Home
                    .ToListAsync();

                var productDtos = products.Select(p => MapToReadDto(p)).ToList();

                return Ok(new ApiResponse<IEnumerable<ProductReadDto>>(
                    true, "Productos públicos obtenidos con éxito", productDtos));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al obtener productos públicos: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Obtiene todos los productos con relaciones (filtrado por usuario)
        /// </summary>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductReadDto>>>> GetProducts()
        {
            try
            {
                // Obtener el usuario autenticado
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));
                }

                // Verificar si es SuperAdmin - puede ver todos los productos
                var isSuperAdmin = User.IsInRole(AppConstants.SuperAdminRole);
                
                IEnumerable<Product> products;
                if (isSuperAdmin)
                {
                    // SuperAdmin ve todos los productos
                    products = await _productService.GetAllProductsAsync();
                }
                else
                {
                    // Usuarios normales solo ven productos de su proveedor
                    var supplier = await _context.Suppliers
                        .FirstOrDefaultAsync(s => s.OwnerUserId == userId);
                    
                    if (supplier == null)
                    {
                        // Si no tiene proveedor asociado, devolver lista vacía
                        products = new List<Product>();
                    }
                    else
                    {
                        products = await _productService.GetProductsBySupplierAsync(supplier.Id);
                    }
                }

                var productDtos = products.Select(p => MapToReadDto(p)).ToList();

                return Ok(new ApiResponse<IEnumerable<ProductReadDto>>(
                    true, "Productos obtenidos con éxito", productDtos));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al obtener productos: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Obtiene un producto específico por ID con todas sus relaciones
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                var productDto = MapToReadDto(product);
                return Ok(new ApiResponse<ProductReadDto>(
                    true, "Producto obtenido con éxito", productDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al obtener producto: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Crea un nuevo producto
        /// </summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> PostProduct([FromForm] ProductCreateDto productDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<Dictionary<string, string>>(
                    false, "Datos inválidos", GetModelStateErrors()));
            }

            try
            {
                // Obtener el usuario autenticado
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));
                }

                // Verificar si es SuperAdmin - tiene permisos especiales
                var isSuperAdmin = User.IsInRole(AppConstants.SuperAdminRole);
                Supplier? supplier = null;

                if (isSuperAdmin)
                {
                    // SuperAdmin usa el proveedor del sistema (creado en SeedData)
                    supplier = await _context.Suppliers
                        .FirstOrDefaultAsync(s => s.CompanyName == "Sistema Administrativo");

                    if (supplier == null)
                    {
                        return StatusCode(500, new ApiResponse<string>(
                            false, "Error del sistema: Proveedor administrativo no encontrado. Contacta al administrador.", null!));
                    }
                }
                else
                {            // FLUJO DE NEGOCIO: Solo usuarios con rol 'Proveedor' pueden crear productos
            if (!User.IsInRole(AppConstants.SupplierRole))
            {
                return BadRequest(new ApiResponse<string>(
                    false, "Solo usuarios con rol Proveedor pueden crear productos. Debes tener una solicitud de proveedor aprobada.", null!));
            }

                    // Para usuarios normales, aplicar las reglas de validación existentes
                    supplier = await _context.Suppliers
                        .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

                    if (supplier == null)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "No tienes un proveedor asociado. Esto es un error del sistema, contacta al administrador.", null!));
                    }

                    if (supplier.Status != AppConstants.SupplierActive)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "Tu proveedor no está activo. Contacta al administrador para activarlo.", null!));
                    }

                    if (!supplier.IsVerified)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "Tu proveedor aún no ha sido verificado. Contacta al administrador para la verificación.", null!));
                    }
                }

                // Verificar permisos para publicar productos
                if (!isSuperAdmin)
                {
                    // Verificar si el usuario tiene permisos como SupplierManager
                    var supplierManager = await _context.SupplierManagers
                        .FirstOrDefaultAsync(sm => sm.SupplierId == supplier.Id && 
                                                  sm.ManagerUserId == userId && 
                                                  sm.IsActive);

                    if (supplierManager == null || !supplierManager.CanManageProducts)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "No tienes permisos para gestionar productos de este proveedor", null!));
                    }

                    if (productDto.IsPublished && !supplierManager.CanPublishProducts)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "No tienes permisos para publicar productos", null!));
                    }

                    // Verificar si el proveedor puede publicar productos (validación adicional)
                    var canPublish = await _productService.CanSupplierPublishProductsAsync(supplier.Id);
                    if (!canPublish && productDto.IsPublished)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "Tu proveedor no está verificado o activo para publicar productos", null!));
                    }
                }

                // Convertir DTO a entidad y asignar el proveedor automáticamente
                var product = productDto.ToEntity(supplier.Id);

                // Procesar imagen si se proporciona
                if (productDto.ImageFile != null)
                {
                    var uploadResult = await UploadImage(productDto.ImageFile);
                    product.ImageUrl = uploadResult.Url;
                    product.ImageFileName = uploadResult.FileName;
                }

                // Crear producto
                var createdProduct = await _productService.CreateProductAsync(product);
                var productReadDto = MapToReadDto(createdProduct);

                // Sincronizar con Meilisearch solo si está publicado (no fallar si no está disponible)
                if (createdProduct.IsPublished)
                {
                    try
                    {
                        await SyncWithSearchEngine(createdProduct);
                    }
                    catch (Exception ex)
                    {
                        // Log el error pero no fallar la creación
                        Console.WriteLine($"Warning: No se pudo sincronizar con Meilisearch: {ex.Message}");
                    }
                }

                return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id },
                    new ApiResponse<ProductReadDto>(true, "Producto creado exitosamente", productReadDto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<string>(false, ex.Message, null!));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al crear producto: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Actualiza un producto existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> PutProduct(int id, [FromForm] ProductUpdateDto productDto)
        {
            if (id != productDto.Id)
            {
                return BadRequest(new ApiResponse<string>(
                    false, "ID de producto no coincide", null!));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<Dictionary<string, string>>(
                    false, "Datos inválidos", GetModelStateErrors()));
            }

            try
            {
                // Obtener el usuario autenticado
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));
                }

                // Verificar si es SuperAdmin
                var isSuperAdmin = User.IsInRole("SuperAdmin");

                // Verificar que el producto existe
                var existingProduct = await _productService.GetProductByIdAsync(id, false);
                if (existingProduct == null)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                // Para SuperAdmin: puede editar cualquier producto
                // Para usuarios normales: solo pueden editar productos de su proveedor
                if (!isSuperAdmin)
                {
                    var userSupplier = await _context.Suppliers
                        .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

                    if (userSupplier == null || existingProduct.SupplierId != userSupplier.Id)
                    {
                        return Forbid("No tienes permisos para editar este producto");
                    }

                    // Verificar si el proveedor puede publicar productos
                    var canPublish = await _productService.CanSupplierPublishProductsAsync(userSupplier.Id);
                    if (!canPublish && productDto.IsPublished)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "Tu proveedor no está verificado o activo para publicar productos", null!));
                    }
                }

                // Convertir DTO a entidad (mantener el SupplierId original)
                var productToUpdate = productDto.ToEntity(existingProduct.SupplierId);
                
                // SuperAdmin puede publicar libremente, usuarios normales necesitan validación
                if (!isSuperAdmin)
                {
                    var canPublish = await _productService.CanSupplierPublishProductsAsync(existingProduct.SupplierId);
                    productToUpdate.IsPublished = canPublish ? productDto.IsPublished : false;
                }

                // Procesar nueva imagen si se proporciona
                if (productDto.ImageFile != null)
                {
                    // Eliminar imagen anterior si existe
                    if (!string.IsNullOrEmpty(existingProduct.ImageFileName))
                    {
                        DeleteImageFile(existingProduct.ImageFileName);
                    }

                    var uploadResult = await UploadImage(productDto.ImageFile);
                    productToUpdate.ImageUrl = uploadResult.Url;
                    productToUpdate.ImageFileName = uploadResult.FileName;
                }
                else
                {
                    // Si no se proporciona nueva imagen, mantener la existente
                    productToUpdate.ImageUrl = existingProduct.ImageUrl;
                    productToUpdate.ImageFileName = existingProduct.ImageFileName;
                }

                // Actualizar producto
                var updatedProduct = await _productService.UpdateProductAsync(id, productToUpdate);
                if (updatedProduct == null)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                // Obtener el producto actualizado con todas las relaciones para el DTO
                var productWithRelations = await _productService.GetProductByIdAsync(id, true);
                var productReadDto = MapToReadDto(productWithRelations!);

                // Sincronizar con Meilisearch (no fallar si no está disponible)
                if (productWithRelations != null)
                {
                    try
                    {
                        await SyncWithSearchEngine(productWithRelations);
                    }
                    catch (Exception ex)
                    {
                        // Log el error pero no fallar la actualización
                        Console.WriteLine($"Warning: No se pudo sincronizar con Meilisearch: {ex.Message}");
                    }
                }

                return Ok(new ApiResponse<ProductReadDto>(
                    true, "Producto actualizado exitosamente", productReadDto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<string>(false, ex.Message, null!));
            }
            catch (Exception ex)
            {
                // Log más detallado para debugging
                var errorMessage = $"Error al actualizar producto: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $" Inner: {ex.InnerException.Message}";
                }
                
                // También log el stack trace en desarrollo
                Console.WriteLine($"Error 500 en PutProduct: {ex}");
                
                return StatusCode(500, new ApiResponse<string>(
                    false, errorMessage, null!));
            }
        }

        /// <summary>
        /// Elimina un producto específico
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id, false);
                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                // Eliminar imagen si existe
                if (!string.IsNullOrEmpty(product.ImageFileName))
                {
                    DeleteImageFile(product.ImageFileName);
                }

                var deleted = await _productService.DeleteProductAsync(id);
                if (!deleted)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                // Sincronizar con Meilisearch
                await _meiliService.DeleteProductAsync(id);

                return Ok(new ApiResponse<int>(
                    true, "Producto eliminado exitosamente", id));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<string>(
                    false, ex.Message, null!));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al eliminar producto: {ex.Message}", null!));
            }
        }

        // Métodos auxiliares privados
        private ProductReadDto MapToReadDto(Product product)
        {
            return new ProductReadDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                ShortDescription = product.ShortDescription,
                Price = product.Price,
                CompareAtPrice = product.CompareAtPrice,
                Stock = product.Stock,
                ImageUrl = product.ImageUrl,
                ImageFileName = product.ImageFileName,
                Brand = product.Brand,
                Sku = product.Sku,
                ExpiryDate = product.ExpiryDate,
                Features = product.Features,
                Specs = product.Specs,
                Badges = product.Badges,
                IsPublished = product.IsPublished,
                IsFeatured = product.IsFeatured,
                HasFreeShipping = product.HasFreeShipping,
                Rating = product.Rating,
                ReviewCount = product.ReviewCount,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name ?? "Sin categoría",
                SupplierId = product.SupplierId,
                SupplierName = product.Supplier?.CompanyName ?? "Sin proveedor",
                IdentityId = product.IdentityId,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };
        }

        private async Task SyncWithSearchEngine(Product product)
        {
            var searchDto = new SearchProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                ShortDescription = product.ShortDescription,
                Price = product.Price,
                ImageUrl = product.ImageUrl,
                Brand = product.Brand,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name ?? "Sin categoría",
                SupplierId = product.SupplierId,
                SupplierName = product.Supplier?.CompanyName ?? "Sin proveedor",
                IdentityId = product.IdentityId,
                Slug = MeiliProductIndexService.GenerateSlug(product.Name),
                Rating = product.Rating,
                ReviewCount = product.ReviewCount,
                IsPublished = product.IsPublished,
                IsFeatured = product.IsFeatured,
                HasFreeShipping = product.HasFreeShipping
            };

            await _meiliService.AddOrUpdateProductAsync(searchDto);
        }

        private Dictionary<string, string> GetModelStateErrors()
        {
            return ModelState.ToDictionary(
                kvp => kvp.Key,
                kvp => string.Join(", ", kvp.Value!.Errors.Select(e => e.ErrorMessage)));
        }

        private async Task<(string Url, string FileName)> UploadImage(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new ArgumentException("El archivo de imagen no es válido");

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(imageFile.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            return ($"/uploads/products/{uniqueFileName}", uniqueFileName);
        }

        /// <summary>
        /// Publica un producto (cambia IsPublished a true)
        /// </summary>
        [HttpPut("{id}/publish")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<ProductReadDto>>> PublishProduct(int id)
        {
            try
            {
                // Obtener el usuario autenticado
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));
                }

                // Verificar si es SuperAdmin
                var isSuperAdmin = User.IsInRole(AppConstants.SuperAdminRole);

                // Obtener el producto
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(
                        false, $"Producto con ID {id} no encontrado", null!));
                }

                // Verificar permisos
                if (!isSuperAdmin)
                {
                    var userSupplier = await _context.Suppliers
                        .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

                    if (userSupplier == null || product.SupplierId != userSupplier.Id)
                    {
                        return Forbid("No tienes permisos para publicar este producto");
                    }

                    // Verificar si el proveedor puede publicar productos
                    var canPublish = await _productService.CanSupplierPublishProductsAsync(userSupplier.Id);
                    if (!canPublish)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "Tu proveedor no está verificado o activo para publicar productos", null!));
                    }

                    // Verificar permisos de SupplierManager
                    var supplierManager = await _context.SupplierManagers
                        .FirstOrDefaultAsync(sm => sm.SupplierId == userSupplier.Id && 
                                                  sm.ManagerUserId == userId && 
                                                  sm.IsActive);

                    if (supplierManager == null || !supplierManager.CanPublishProducts)
                    {
                        return BadRequest(new ApiResponse<string>(
                            false, "No tienes permisos para publicar productos", null!));
                    }
                }

                // Ya está publicado
                if (product.IsPublished)
                {
                    return BadRequest(new ApiResponse<string>(
                        false, "El producto ya está publicado", null!));
                }

                // Actualizar estado a publicado
                product.IsPublished = true;
                product.UpdatedAt = DateTime.UtcNow;

                var updatedProduct = await _productService.UpdateProductAsync(id, product);
                if (updatedProduct == null)
                {
                    return StatusCode(500, new ApiResponse<string>(
                        false, "Error al actualizar el producto", null!));
                }

                var productReadDto = MapToReadDto(updatedProduct);

                // Sincronizar con Meilisearch ahora que está publicado (no fallar si no está disponible)
                try
                {
                    await SyncWithSearchEngine(updatedProduct);
                }
                catch (Exception ex)
                {
                    // Log el error pero no fallar la publicación
                    Console.WriteLine($"Warning: No se pudo sincronizar con Meilisearch: {ex.Message}");
                }

                return Ok(new ApiResponse<ProductReadDto>(
                    true, "Producto publicado exitosamente", productReadDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(
                    false, $"Error al publicar producto: {ex.Message}", null!));
            }
        }

        private void DeleteImageFile(string fileName)
        {
            var imagePath = Path.Combine(_environment.WebRootPath, "uploads", "products", fileName);
            if (System.IO.File.Exists(imagePath))
            {
                System.IO.File.Delete(imagePath);
            }
        }
    }
}