using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;
using TiendaOnline.Server.DTO;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetUserId()
        {
            // Obtener el ID del usuario autenticado
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("Usuario no autenticado");
            }
            return userId;
        }

        private string GetSessionId()
        {
            // Para compatibilidad con carrito, usar sessionId del header o generar uno basado en usuario
            var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(sessionId))
            {
                try
                {
                    var userId = GetUserId();
                    sessionId = $"user_{userId}";
                }
                catch
                {
                    var userAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "";
                    var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
                    sessionId = $"anonymous_{ip}_{DateTime.UtcNow.Ticks}_{userAgent.GetHashCode()}".Replace(" ", "");
                }
            }
            return sessionId;
        }

        private string GenerateOrderNumber()
        {
            // Formato más corto: ORD + yyMMddHHmm + 4 dígitos random = 17 caracteres max
            var timestamp = DateTime.UtcNow.ToString("yyMMddHHmm");
            var random = new Random().Next(1000, 9999);
            return $"ORD{timestamp}{random}";
        }

        [HttpPost("checkout")]
        [Authorize]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<OrderReadDto>>> CreateOrderFromCart([FromBody] OrderCreateDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Intentar obtener userId, si no existe usar sessionId
                string? userId = null;
                try
                {
                    userId = GetUserId();
                }
                catch (UnauthorizedAccessException)
                {
                    // Usuario anónimo, continuar con sessionId
                }
                
                var sessionId = GetSessionId();

                // 1. Obtener items del carrito
                var cartItems = await _context.CartItems
                    .Where(c => c.SessionId == sessionId)
                    .ToListAsync();

                if (!cartItems.Any())
                {
                    return BadRequest(new ApiResponse<string>(false, "El carrito está vacío", null!));
                }

                // 2. Verificar stock de productos
                foreach (var cartItem in cartItems)
                {
                    var product = await _context.Products.FindAsync(cartItem.ProductId);
                    if (product == null)
                    {
                        return BadRequest(new ApiResponse<string>(false, $"Producto {cartItem.ProductName} no encontrado", null!));
                    }
                    if (product.Stock < cartItem.Quantity)
                    {
                        return BadRequest(new ApiResponse<string>(false, $"Stock insuficiente para {cartItem.ProductName}. Disponible: {product.Stock}", null!));
                    }
                }

                // 3. Calcular totales
                var subtotal = cartItems.Sum(item => item.UnitPrice * item.Quantity);
                // No aplicamos impuestos al cliente por ahora (0%)
                var taxTotal = 0m;
                var shippingTotal = subtotal > 50 ? 0 : 2.99m; // Envío gratis si >$50
                var discountTotal = 0m; // Por ahora sin descuentos
                var orderTotal = subtotal + taxTotal + shippingTotal - discountTotal;

                // 4. Obtener o crear Customer para el usuario
                Customer? customer = null;
                if (!string.IsNullOrEmpty(userId))
                {
                    customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
                    if (customer == null)
                    {
                        // Si no existe un Customer para este usuario, crear uno básico
                        customer = new Customer
                        {
                            UserId = userId,
                            CreatedAt = DateTime.UtcNow,
                            Language = "es",
                            Currency = "USD",
                            NewsletterSubscription = true
                        };
                        _context.Customers.Add(customer);
                        await _context.SaveChangesAsync();
                    }
                }

                // 5. Crear la orden
                var order = new Order
                {
                    OrderNumber = GenerateOrderNumber(),
                    OrderType = "product",
                    CustomerId = customer?.Id ?? 1, // ID por defecto para usuario
                    OwnerUserId = userId, // ID del usuario autenticado (null para anónimos)
                    CustomerEmail = dto.CustomerEmail,
                    CustomerPhone = dto.CustomerPhone ?? "",
                    CustomerFullName = dto.CustomerFullName,
                    
                    // Totales
                    SubTotal = subtotal,
                    TaxTotal = taxTotal,
                    ShippingTotal = shippingTotal,
                    DiscountTotal = discountTotal,
                    OrderTotal = orderTotal,
                    
                    // Estados
                    Status = AppConstants.OrderPending,
                    PaymentStatus = AppConstants.PaymentPending,
                    ShippingStatus = AppConstants.ShippingNotShipped,
                    
                    // Información adicional
                    ShippingMethod = dto.ShippingMethod,
                    CustomerNotes = dto.CustomerNotes,
                    
                    // Fechas
                    OrderDate = DateTime.UtcNow,
                    
                    // Snapshots de direcciones (sin asignar IDs, solo snapshots)
                    BillingAddressSnapshot = JsonSerializer.Serialize(dto.BillingAddress),
                    ShippingAddressSnapshot = JsonSerializer.Serialize(dto.ShippingAddress)
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // 6. Crear OrderItems desde CartItems
                foreach (var cartItem in cartItems)
                {
                    var product = await _context.Products.FindAsync(cartItem.ProductId);
                    var supplier = await _context.Suppliers.FindAsync(product!.SupplierId);

                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = cartItem.ProductId,
                        SupplierId = product.SupplierId,
                        
                        // Snapshots del producto
                        ItemName = cartItem.ProductName,
                        ItemImage = cartItem.ProductImage,
                        Sku = cartItem.ProductSku,
                        
                        // Cantidades y precios
                        Quantity = cartItem.Quantity,
                        UnitPrice = cartItem.UnitPrice,
                        // Sin impuestos al cliente por ahora
                        TaxAmount = 0m,
                        DiscountAmount = 0m,
                        TotalPrice = cartItem.UnitPrice * cartItem.Quantity,
                        
                        // Información adicional
                        Brand = product.Brand,
                        Weight = product.Weight.ToString(),
                        Dimensions = null, // Campo no disponible en Product
                        
                        // Estados
                        Status = AppConstants.OrderItemActive,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.OrderItems.Add(orderItem);

                    // 7. Actualizar stock del producto
                    product.Stock -= cartItem.Quantity;
                }

                // 8. Limpiar el carrito
                _context.CartItems.RemoveRange(cartItems);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 9. Preparar respuesta
                var result = new OrderReadDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderType = order.OrderType,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    CustomerFullName = order.CustomerFullName,
                    SubTotal = order.SubTotal,
                    TaxTotal = order.TaxTotal,
                    ShippingTotal = order.ShippingTotal,
                    DiscountTotal = order.DiscountTotal,
                    OrderTotal = order.OrderTotal,
                    Status = order.Status,
                    PaymentStatus = order.PaymentStatus,
                    ShippingStatus = order.ShippingStatus,
                    ShippingMethod = order.ShippingMethod,
                    OrderDate = order.OrderDate,
                    CustomerNotes = order.CustomerNotes,
                    BillingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.BillingAddressSnapshot),
                    ShippingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.ShippingAddressSnapshot)
                };

                return CreatedAtAction(nameof(GetOrderById), new { id = order.Id },
                    new ApiResponse<OrderReadDto>(true, "Orden creada exitosamente", result));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new ApiResponse<string>(false, $"Error al crear la orden: {ex.Message}", null!));
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ApiResponse<OrderReadDto>>> GetOrderById(int id)
        {
            try
            {
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.Id == id);

                var orderItems = await _context.OrderItems
                    .Where(oi => oi.OrderId == id)
                    .ToListAsync();

                if (order == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Orden no encontrada", null!));
                }

                var result = new OrderReadDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderType = order.OrderType,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    CustomerFullName = order.CustomerFullName,
                    SubTotal = order.SubTotal,
                    TaxTotal = order.TaxTotal,
                    ShippingTotal = order.ShippingTotal,
                    DiscountTotal = order.DiscountTotal,
                    OrderTotal = order.OrderTotal,
                    Status = order.Status,
                    PaymentStatus = order.PaymentStatus,
                    ShippingStatus = order.ShippingStatus,
                    ShippingMethod = order.ShippingMethod,
                    TrackingNumber = order.TrackingNumber,
                    OrderDate = order.OrderDate,
                    ShippingDate = null, // Campo no disponible en Order
                    DeliveryDate = null, // Campo no disponible en Order
                    CustomerNotes = order.CustomerNotes,
                    AdminNotes = order.AdminNotes,
                    BillingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.BillingAddressSnapshot ?? "{}"),
                    ShippingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.ShippingAddressSnapshot ?? "{}"),
                    Items = orderItems.Select(item => new OrderItemReadDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId ?? 0,
                        ItemName = item.ItemName,
                        ItemImage = item.ItemImage,
                        Sku = item.Sku,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TaxAmount = item.TaxAmount,
                        DiscountAmount = item.DiscountAmount,
                        TotalPrice = item.TotalPrice,
                        Brand = item.Brand
                    }).ToList()
                };

                return Ok(new ApiResponse<OrderReadDto>(true, "Orden obtenida exitosamente", result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener la orden: {ex.Message}", null!));
            }
        }

        [HttpGet("my-orders")]
        [Authorize] 
        [ProducesResponseType(200)]
        public async Task<ActionResult<ApiResponse<List<OrderReadDto>>>> GetMyOrders()
        {
            try
            {
                // Intentar obtener userId, si no existe usar sessionId
                string? userId = null;
                try
                {
                    userId = GetUserId();
                }
                catch (UnauthorizedAccessException)
                {
                    // Usuario anónimo, usar sessionId para buscar órdenes por OwnerUserId
                    var sessionId = GetSessionId();
                    userId = sessionId;
                }
                
                var orders = await _context.Orders
                    .Where(o => o.OwnerUserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Include(o => o.OrderItems)
                    .Select(o => new OrderReadDto
                    {
                        Id = o.Id,
                        OrderNumber = o.OrderNumber,
                        OrderType = o.OrderType,
                        CustomerEmail = o.CustomerEmail,
                        CustomerFullName = o.CustomerFullName,
                        OrderTotal = o.OrderTotal,
                        SubTotal = o.SubTotal,
                        TaxTotal = o.TaxTotal,
                        ShippingTotal = o.ShippingTotal,
                        Status = o.Status,
                        PaymentStatus = o.PaymentStatus,
                        ShippingStatus = o.ShippingStatus,
                        OrderDate = o.OrderDate,
                        TrackingNumber = o.TrackingNumber,
                        Items = o.OrderItems.Select(item => new OrderItemReadDto
                        {
                            Id = item.Id,
                            ProductId = item.ProductId ?? 0,
                            ItemName = item.ItemName,
                            ItemImage = item.ItemImage,
                            Sku = item.Sku,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            TaxAmount = item.TaxAmount,
                            DiscountAmount = item.DiscountAmount,
                            TotalPrice = item.TotalPrice,
                            Brand = item.Brand
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<OrderReadDto>>(true, "Órdenes obtenidas exitosamente", orders));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener las órdenes: {ex.Message}", null!));
            }
        }

        [HttpGet("{id}/can-cancel")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ApiResponse<bool>>> CanCancelOrder(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                {
                    return NotFound(new ApiResponse<bool>(false, "Orden no encontrada", false));
                }

                // Verificar que el usuario tenga permisos para ver esta orden
                var userId = GetUserId();
                if (order.OwnerUserId != userId)
                {
                    return Forbid();
                }

                var canCancel = CanCancelOrderInternal(order);
                var message = canCancel 
                    ? "La orden puede ser cancelada" 
                    : GetCancellationRestrictionMessage(order);

                return Ok(new ApiResponse<bool>(true, message, canCancel));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>(false, $"Error al verificar cancelación: {ex.Message}", false));
            }
        }

        [HttpPost("{id}/cancel")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ApiResponse<OrderReadDto>>> CancelOrder(int id, [FromBody] OrderCancelDto cancelDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Orden no encontrada", null!));
                }

                // Verificar que el usuario tenga permisos para cancelar esta orden
                var userId = GetUserId();
                if (order.OwnerUserId != userId)
                {
                    return Forbid();
                }

                // Verificar si se puede cancelar
                if (!CanCancelOrderInternal(order))
                {
                    return BadRequest(new ApiResponse<string>(false, GetCancellationRestrictionMessage(order), null!));
                }

                // Restaurar stock de productos
                foreach (var orderItem in order.OrderItems)
                {
                    if (orderItem.ProductId.HasValue)
                    {
                        var product = await _context.Products.FindAsync(orderItem.ProductId.Value);
                        if (product != null)
                        {
                            product.Stock += orderItem.Quantity;
                            _context.Products.Update(product);
                        }
                    }
                }

                // Actualizar la orden
                order.Status = AppConstants.OrderCancelled;
                order.CancelledDate = DateTime.UtcNow;
                order.CancellationReason = cancelDto.CancellationReason;
                order.CancellationNotes = cancelDto.CancellationNotes;
                order.UpdatedAt = DateTime.UtcNow;

                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Preparar respuesta
                var result = new OrderReadDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderType = order.OrderType,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    CustomerFullName = order.CustomerFullName,
                    SubTotal = order.SubTotal,
                    TaxTotal = order.TaxTotal,
                    ShippingTotal = order.ShippingTotal,
                    DiscountTotal = order.DiscountTotal,
                    OrderTotal = order.OrderTotal,
                    Status = order.Status,
                    PaymentStatus = order.PaymentStatus,
                    ShippingStatus = order.ShippingStatus,
                    ShippingMethod = order.ShippingMethod,
                    TrackingNumber = order.TrackingNumber,
                    OrderDate = order.OrderDate,
                    CustomerNotes = order.CustomerNotes,
                    AdminNotes = order.AdminNotes,
                    BillingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.BillingAddressSnapshot ?? "{}"),
                    ShippingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.ShippingAddressSnapshot ?? "{}"),
                    Items = order.OrderItems.Select(item => new OrderItemReadDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId ?? 0,
                        ItemName = item.ItemName,
                        ItemImage = item.ItemImage,
                        Sku = item.Sku,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TaxAmount = item.TaxAmount,
                        DiscountAmount = item.DiscountAmount,
                        TotalPrice = item.TotalPrice,
                        Brand = item.Brand
                    }).ToList()
                };

                return Ok(new ApiResponse<OrderReadDto>(true, "Orden cancelada exitosamente", result));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new ApiResponse<string>(false, $"Error al cancelar la orden: {ex.Message}", null!));
            }
        }

        // Métodos privados de ayuda
        private bool CanCancelOrderInternal(Order order)
        {
            // No se puede cancelar si ya está cancelada, completada o reembolsada
            if (order.Status == AppConstants.OrderCancelled || 
                order.Status == AppConstants.OrderDelivered ||
                order.Status == AppConstants.OrderRefunded)
            {
                return false;
            }

            // No se puede cancelar si ya fue enviada
            if (order.ShippingStatus == AppConstants.ShippingShipped ||
                order.ShippingStatus == AppConstants.ShippingDelivered)
            {
                return false;
            }

            // Verificar límite de tiempo (24 horas desde la creación para órdenes pendientes)
            var timeLimitHours = 24;
            if (order.Status == AppConstants.OrderPending)
            {
                timeLimitHours = 48; // Más tiempo para órdenes pendientes
            }
            else if (order.Status == AppConstants.OrderProcessing)
            {
                timeLimitHours = 12; // Menos tiempo si ya está siendo procesada
            }

            var timeElapsed = DateTime.UtcNow - order.OrderDate;
            if (timeElapsed.TotalHours > timeLimitHours)
            {
                return false;
            }

            return true;
        }

        private string GetCancellationRestrictionMessage(Order order)
        {
            if (order.Status == AppConstants.OrderCancelled)
            {
                return "La orden ya fue cancelada";
            }

            if (order.Status == AppConstants.OrderDelivered)
            {
                return "No se puede cancelar una orden que ya fue entregada";
            }

            if (order.Status == AppConstants.OrderRefunded)
            {
                return "La orden ya fue reembolsada";
            }

            if (order.ShippingStatus == AppConstants.ShippingShipped ||
                order.ShippingStatus == AppConstants.ShippingDelivered)
            {
                return "No se puede cancelar una orden que ya fue enviada";
            }

            var timeLimitHours = order.Status == AppConstants.OrderPending ? 48 : 
                               order.Status == AppConstants.OrderProcessing ? 12 : 24;
            var timeElapsed = DateTime.UtcNow - order.OrderDate;
            
            if (timeElapsed.TotalHours > timeLimitHours)
            {
                var hoursRemaining = timeLimitHours - timeElapsed.TotalHours;
                return $"El tiempo límite para cancelar esta orden ha expirado. " +
                       $"Tenías {timeLimitHours} horas desde la creación para cancelarla.";
            }

            return "La orden no puede ser cancelada en este momento";
        }

        // SUPPLIER MANAGEMENT ENDPOINTS

        /// <summary>
        /// Get all orders for supplier management (Admin/Supplier role required)
        /// </summary>
        [HttpGet("manage")]
        [Authorize(Roles = "Administrator,Proveedor")]
        public async Task<ActionResult<ApiResponse<List<OrderReadDto>>>> GetOrdersForManagement()
        {
            try
            {
                var userId = GetUserId();
                var userRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

                IQueryable<Order> ordersQuery = _context.Orders
                    .Include(o => o.Customer)
                        .ThenInclude(c => c.User)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product);

                // If user is a supplier (not admin), filter by their products
                if (userRoles.Contains("Proveedor") && !userRoles.Contains("SuperAdmin"))
                {
                    var user = await _context.Users
                        .Include(u => u.Supplier)
                        .FirstOrDefaultAsync(u => u.Id == userId);

                    if (user?.Supplier != null)
                    {
                        // Filter orders that contain products from this supplier
                        ordersQuery = ordersQuery.Where(o => o.OrderItems.Any(oi => oi.Product.SupplierId == user.Supplier!.Id));
                    }
                    else
                    {
                        return BadRequest(new ApiResponse<List<OrderReadDto>>(
                            false,
                            "Usuario no está asociado a un proveedor",
                            new List<OrderReadDto>()
                        ));
                    }
                }

                var orders = await ordersQuery
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                var orderDtos = orders.Select(order => new OrderReadDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderType = order.OrderType,
                    OrderDate = order.OrderDate,
                    Status = order.Status,
                    ShippingStatus = order.ShippingStatus,
                    PaymentStatus = order.PaymentStatus,
                    ShippingMethod = order.ShippingMethod,
                    TrackingNumber = order.TrackingNumber,
                    SubTotal = order.SubTotal,
                    ShippingTotal = order.ShippingTotal,
                    TaxTotal = order.TaxTotal,
                    DiscountTotal = order.DiscountTotal,
                    OrderTotal = order.OrderTotal,
                    AdminNotes = order.AdminNotes,
                    CustomerNotes = order.CustomerNotes,
                    CustomerFullName = order.CustomerFullName,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    ShippingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.ShippingAddressSnapshot),
                    BillingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.BillingAddressSnapshot),
                    Items = order.OrderItems.Select(oi => new OrderItemReadDto
                    {
                        Id = oi.Id,
                        ProductId = oi.ProductId ?? 0,
                        ItemName = oi.ItemName,
                        ItemImage = oi.ItemImage,
                        Sku = oi.Sku,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        TaxAmount = oi.TaxAmount,
                        DiscountAmount = oi.DiscountAmount,
                        TotalPrice = oi.TotalPrice,
                        Brand = oi.Brand
                    }).ToList()
                }).ToList();

                return Ok(new ApiResponse<List<OrderReadDto>>(
                    true,
                    "Órdenes obtenidas exitosamente",
                    orderDtos
                ));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<OrderReadDto>>(
                    false,
                    $"Error interno del servidor: {ex.Message}",
                    new List<OrderReadDto>()
                ));
            }
        }

        /// <summary>
        /// Update order status and details (Admin/Supplier role required)
        /// </summary>
        [HttpPut("{id}/update")]
        [Authorize(Roles = "Administrator,Proveedor")]
        public async Task<ActionResult<ApiResponse<OrderReadDto>>> UpdateOrder(int id, [FromBody] OrderUpdateDto updateDto)
        {
            try
            {
                var userId = GetUserId();
                var userRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

                var order = await _context.Orders
                    .Include(o => o.Customer)
                        .ThenInclude(c => c.User)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new ApiResponse<OrderReadDto>(
                        false,
                        "Orden no encontrada",
                        new OrderReadDto()
                    ));
                }

                // Check if supplier has permission to update this order
                if (userRoles.Contains("Proveedor") && !userRoles.Contains("Administrator"))
                {
                    var user = await _context.Users
                        .Include(u => u.Supplier)
                        .FirstOrDefaultAsync(u => u.Id == userId);

                    if (user?.Supplier == null)
                    {
                        return BadRequest(new ApiResponse<OrderReadDto>(
                            false,
                            "Usuario no está asociado a un proveedor",
                            new OrderReadDto()
                        ));
                    }

                    // Check if order contains products from this supplier
                    var hasSupplierProducts = order.OrderItems.Any(oi => oi.Product.SupplierId == user.Supplier!.Id);
                    if (!hasSupplierProducts)
                    {
                        return Forbid("No tienes permisos para actualizar esta orden");
                    }
                }

                // Validate status transitions
                var validStatuses = new[] { AppConstants.OrderPending, AppConstants.OrderProcessing, AppConstants.OrderShipped, AppConstants.OrderDelivered, AppConstants.OrderCancelled };
                var validShippingStatuses = new[] { AppConstants.ShippingNotShipped, AppConstants.ShippingShipped, AppConstants.ShippingDelivered };

                if (!validStatuses.Contains(updateDto.Status))
                {
                    return BadRequest(new ApiResponse<OrderReadDto>(
                        false,
                        "Estado de orden inválido",
                        new OrderReadDto()
                    ));
                }

                if (!validShippingStatuses.Contains(updateDto.ShippingStatus))
                {
                    return BadRequest(new ApiResponse<OrderReadDto>(
                        false,
                        "Estado de envío inválido",
                        new OrderReadDto()
                    ));
                }

                // Update order properties
                order.Status = updateDto.Status;
                order.ShippingStatus = updateDto.ShippingStatus;
                order.TrackingNumber = updateDto.TrackingNumber;
                order.AdminNotes = updateDto.AdminNotes;

                // Update status-specific dates
                if (updateDto.Status == AppConstants.OrderProcessing && order.ProcessingDate == null)
                {
                    order.ProcessingDate = DateTime.UtcNow;
                }
                else if (updateDto.Status == AppConstants.OrderShipped && order.ShippedDate == null)
                {
                    order.ShippedDate = DateTime.UtcNow;
                }
                else if (updateDto.Status == AppConstants.OrderDelivered && order.DeliveredDate == null)
                {
                    order.DeliveredDate = DateTime.UtcNow;
                }
                else if (updateDto.Status == AppConstants.OrderCancelled && order.CancelledDate == null)
                {
                    order.CancelledDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Return updated order
                var orderDto = new OrderReadDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderType = order.OrderType,
                    OrderDate = order.OrderDate,
                    Status = order.Status,
                    ShippingStatus = order.ShippingStatus,
                    PaymentStatus = order.PaymentStatus,
                    ShippingMethod = order.ShippingMethod,
                    TrackingNumber = order.TrackingNumber,
                    SubTotal = order.SubTotal,
                    ShippingTotal = order.ShippingTotal,
                    TaxTotal = order.TaxTotal,
                    DiscountTotal = order.DiscountTotal,
                    OrderTotal = order.OrderTotal,
                    AdminNotes = order.AdminNotes,
                    CustomerNotes = order.CustomerNotes,
                    CustomerFullName = order.CustomerFullName,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    ShippingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.ShippingAddressSnapshot),
                    BillingAddress = JsonSerializer.Deserialize<AddressReadDto>(order.BillingAddressSnapshot),
                    Items = order.OrderItems.Select(oi => new OrderItemReadDto
                    {
                        Id = oi.Id,
                        ProductId = oi.ProductId ?? 0,
                        ItemName = oi.ItemName,
                        ItemImage = oi.ItemImage,
                        Sku = oi.Sku,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        TaxAmount = oi.TaxAmount,
                        DiscountAmount = oi.DiscountAmount,
                        TotalPrice = oi.TotalPrice,
                        Brand = oi.Brand
                    }).ToList()
                };

                return Ok(new ApiResponse<OrderReadDto>(
                    true,
                    "Orden actualizada exitosamente",
                    orderDto
                ));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<OrderReadDto>(
                    false,
                    $"Error interno del servidor: {ex.Message}",
                    new OrderReadDto()
                ));
            }
        }
    }
}
