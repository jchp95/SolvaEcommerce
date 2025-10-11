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
    public class CartItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartItemsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetSessionId()
        {
            // Aquí puedes obtener el sessionId desde cookies, encabezados, etc.
            // Por ahora asumiremos un header personalizado
            return Request.Headers["X-Session-Id"].ToString();
        }

        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<CartItemReadDto>>>> GetCartItems()
        {
            try
            {
                var sessionId = GetSessionId();

                var items = await (from c in _context.CartItems
                                   join p in _context.Products on c.ProductId equals p.Id
                                   where c.SessionId == sessionId
                                   select new CartItemReadDto
                                   {
                                       Id = c.Id,
                                       ProductId = p.Id,
                                       Quantity = c.Quantity,
                                       Name = p.Name,
                                       Price = p.Price,
                                       ImageUrl = p.ImageUrl
                                   }).ToListAsync();

                return Ok(new ApiResponse<IEnumerable<CartItemReadDto>>(true, "Carrito obtenido con éxito", items));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener carrito: {ex.Message}", null!));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CartItemReadDto>>> GetCartItemById(int id)
        {
            var item = await (from c in _context.CartItems
                              join p in _context.Products on c.ProductId equals p.Id
                              where c.Id == id
                              select new CartItemReadDto
                              {
                                  Id = c.Id,
                                  ProductId = c.ProductId,
                                  Quantity = c.Quantity,
                                  Name = p.Name,
                                  Price = p.Price,
                                  ImageUrl = p.ImageUrl
                              }).FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new ApiResponse<string>(false, "Item no encontrado", null!));
            }

            return Ok(new ApiResponse<CartItemReadDto>(true, "Item obtenido", item));
        }


        [HttpPost]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<CartItemReadDto>>> CreateCartItem([FromBody] CartItemCreateDto dto)
        {
            try
            {
                if (dto.Quantity < 1)
                {
                    return BadRequest(new ApiResponse<string>(false, "La cantidad debe ser al menos 1", null!));
                }

                var sessionId = GetSessionId();
                var product = await _context.Products.FindAsync(dto.ProductId);

                if (product == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Producto no encontrado", null!));
                }

                var existing = await _context.CartItems
                    .FirstOrDefaultAsync(c => c.ProductId == dto.ProductId && c.SessionId == sessionId);

                if (existing != null)
                {
                    existing.Quantity += dto.Quantity;
                    await _context.SaveChangesAsync();

                    return Ok(new ApiResponse<CartItemReadDto>(true, "Cantidad actualizada", new CartItemReadDto
                    {
                        Id = existing.Id,
                        ProductId = existing.ProductId,
                        Quantity = existing.Quantity,
                        Name = product.Name,
                        Price = product.Price,
                        ImageUrl = product.ImageUrl
                    }));
                }

                var newItem = new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    SessionId = sessionId,
                    IdentityId = 0
                };

                _context.CartItems.Add(newItem);
                await _context.SaveChangesAsync();

                var result = new CartItemReadDto
                {
                    Id = newItem.Id,
                    ProductId = newItem.ProductId,
                    Quantity = newItem.Quantity,
                    Name = product.Name,
                    Price = product.Price,
                    ImageUrl = product.ImageUrl
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
        public async Task<ActionResult<ApiResponse<CartItem>>> UpdateCartItem(int id, [FromBody] CartItemUpdateDto dto)
        {
            var item = await _context.CartItems.FindAsync(id);
            if (item == null)
                return NotFound(new ApiResponse<string>(false, "Item no encontrado", null!));

            item.Quantity = dto.Quantity;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<CartItem>(true, "Cantidad actualizada", item));
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
        public async Task<IActionResult> ClearCart()
        {
            var items = await _context.CartItems.ToListAsync();
            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
