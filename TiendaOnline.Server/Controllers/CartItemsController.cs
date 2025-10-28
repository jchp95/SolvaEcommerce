using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;
using TiendaOnline.Server.DTO;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class CartItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartItemsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetSessionId()
        {
            // Primero intenta obtener el sessionId del header
            var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();
            
            // Si no existe, genera uno nuevo basado en IP y timestamp
            if (string.IsNullOrEmpty(sessionId))
            {
                var userAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "";
                var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
                sessionId = $"anonymous_{ip}_{DateTime.UtcNow.Ticks}_{userAgent.GetHashCode()}".Replace(" ", "");
            }
            
            return sessionId;
        }

        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<CartItemReadDto>>>> GetCartItems()
        {
            try
            {
                var sessionId = GetSessionId();

                // Usar los snapshots del CartItem en lugar de JOIN con Products
                var items = await _context.CartItems
                    .Where(c => c.SessionId == sessionId)
                    .Select(c => new CartItemReadDto
                    {
                        Id = c.Id,
                        ProductId = c.ProductId,
                        Quantity = c.Quantity,
                        Name = c.ProductName,
                        Price = c.UnitPrice,
                        ImageUrl = c.ProductImage,
                        Sku = c.ProductSku,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        TotalPrice = c.TotalPrice
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<CartItemReadDto>>(true, "Carrito obtenido con éxito", items));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener carrito: {ex.Message}", null!));
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ApiResponse<CartItemReadDto>>> GetCartItemById(int id)
        {
            try
            {
                var cartItem = await _context.CartItems.FindAsync(id);

                if (cartItem == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Item no encontrado", null!));
                }

                var item = new CartItemReadDto
                {
                    Id = cartItem.Id,
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    Name = cartItem.ProductName,
                    Price = cartItem.UnitPrice,
                    ImageUrl = cartItem.ProductImage,
                    Sku = cartItem.ProductSku,
                    CreatedAt = cartItem.CreatedAt,
                    UpdatedAt = cartItem.UpdatedAt,
                    TotalPrice = cartItem.TotalPrice
                };

                return Ok(new ApiResponse<CartItemReadDto>(true, "Item obtenido", item));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener item: {ex.Message}", null!));
            }
        }


        [HttpPost]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<CartItemReadDto>>> CreateCartItem([FromBody] CartItemCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<string>(false, "Datos inválidos", null!));
                }

                var sessionId = GetSessionId();
                var product = await _context.Products.FindAsync(dto.ProductId);

                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Producto no encontrado", null!));
                }

                // Verificar si el producto ya existe en el carrito
                var existing = await _context.CartItems
                    .FirstOrDefaultAsync(c => c.ProductId == dto.ProductId && c.SessionId == sessionId);

                if (existing != null)
                {
                    // Actualizar cantidad y fecha
                    existing.Quantity += dto.Quantity;
                    existing.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return Ok(new ApiResponse<CartItemReadDto>(true, "Cantidad actualizada", new CartItemReadDto
                    {
                        Id = existing.Id,
                        ProductId = existing.ProductId,
                        Quantity = existing.Quantity,
                        Name = existing.ProductName,
                        Price = existing.UnitPrice,
                        ImageUrl = existing.ProductImage,
                        Sku = existing.ProductSku,
                        CreatedAt = existing.CreatedAt,
                        UpdatedAt = existing.UpdatedAt,
                        TotalPrice = existing.TotalPrice
                    }));
                }

                // Crear nuevo item con snapshots del producto
                var newItem = new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    SessionId = sessionId,
                    IdentityId = 0,
                    // Snapshots del producto al momento de agregar al carrito
                    UnitPrice = product.Price,
                    ProductName = product.Name,
                    ProductImage = product.ImageUrl ?? "",
                    ProductSku = product.Sku,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CartItems.Add(newItem);
                await _context.SaveChangesAsync();

                var result = new CartItemReadDto
                {
                    Id = newItem.Id,
                    ProductId = newItem.ProductId,
                    Quantity = newItem.Quantity,
                    Name = newItem.ProductName,
                    Price = newItem.UnitPrice,
                    ImageUrl = newItem.ProductImage,
                    Sku = newItem.ProductSku,
                    CreatedAt = newItem.CreatedAt,
                    UpdatedAt = newItem.UpdatedAt,
                    TotalPrice = newItem.TotalPrice
                };

                return CreatedAtAction(nameof(GetCartItemById), new { id = newItem.Id },
                    new ApiResponse<CartItemReadDto>(true, "Producto agregado al carrito", result));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al agregar al carrito: {ex.Message}", null!));
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<ApiResponse<CartItemReadDto>>> UpdateCartItem(int id, [FromBody] CartItemUpdateDto dto)
        {
            try
            {
                var item = await _context.CartItems.FindAsync(id);
                if (item == null)
                    return NotFound(new ApiResponse<string>(false, "Item no encontrado", null!));

                if (dto.Quantity < 1)
                    return BadRequest(new ApiResponse<string>(false, "La cantidad debe ser al menos 1", null!));

                item.Quantity = dto.Quantity;
                item.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var result = new CartItemReadDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Name = item.ProductName,
                    Price = item.UnitPrice,
                    ImageUrl = item.ProductImage,
                    Sku = item.ProductSku,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt,
                    TotalPrice = item.TotalPrice
                };

                return Ok(new ApiResponse<CartItemReadDto>(true, "Cantidad actualizada", result));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al actualizar item: {ex.Message}", null!));
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteCartItem(int id)
        {
            try
            {
                var item = await _context.CartItems.FindAsync(id);
                if (item == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Item no encontrado", null!));
                }

                _context.CartItems.Remove(item);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<int>(true, "Item eliminado con éxito", id));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al eliminar item: {ex.Message}", null!));
            }
        }

        [HttpDelete("clear")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<string>>> ClearCart()
        {
            try
            {
                var sessionId = GetSessionId();
                var items = await _context.CartItems
                    .Where(c => c.SessionId == sessionId)
                    .ToListAsync();
                
                _context.CartItems.RemoveRange(items);
                await _context.SaveChangesAsync();
                
                return Ok(new ApiResponse<string>(true, $"Carrito limpiado. {items.Count} items eliminados.", "success"));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al limpiar carrito: {ex.Message}", null!));
            }
        }
    }
}
