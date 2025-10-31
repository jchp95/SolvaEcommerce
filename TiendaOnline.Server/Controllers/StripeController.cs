using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Stripe;
using TiendaOnline.Server.Interfaces.Payments;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.DTO.Payment;
using TiendaOnline.Server.Models;
using System.Security.Claims;

namespace TiendaOnline.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StripeController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ILogger<StripeController> _logger;
    private readonly ApplicationDbContext _db;

    public StripeController(IStripeService stripeService, ILogger<StripeController> logger, ApplicationDbContext db)
    {
        _stripeService = stripeService;
        _logger = logger;
        _db = db;
    }

    [Authorize]
    [HttpPost("procesar-pago-stripe")]
    public async Task<IActionResult> ProcesarPago([FromBody] StripePaymentRequest request)
    {
        if (request == null)
            return BadRequest(new ApiResponse<string>(false, "Request body is required", null!));

        if (string.IsNullOrEmpty(request.StripeToken))
            return BadRequest(new ApiResponse<string>(false, "StripeToken is required", null!));
        
        if (request.OrderId <= 0)
            return BadRequest(new ApiResponse<string>(false, "Order is required", null!));
        
        // Obtener los supplierId asociados a los productos de la orden
        int supplierId = request.SupplierId;
        if (supplierId <= 0)
        {
            try
            {
                var supplierIds = await _db.OrderItems
                    .Where(i => i.OrderId == request.OrderId)
                    .Select(i => i.SupplierId)
                    .Distinct()
                    .ToListAsync();

                if (supplierIds == null || supplierIds.Count == 0)
                {
                    return BadRequest(new ApiResponse<string>(false, "No se encontraron productos para la orden especificada.", null!));
                }

                if (supplierIds.Count > 1)
                {
                    // La orden contiene productos de múltiples proveedores: el frontend debe procesar pagos por proveedor
                    return BadRequest(new ApiResponse<string>(false, "La orden contiene productos de múltiples proveedores. Debes realizar un pago por cada proveedor (envía SupplierId) o dividir la orden por proveedor.", null!));
                }

                // Si hay exactamente un supplier asociado, usarlo
                supplierId = supplierIds.First();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inferring supplier from order items");
                return StatusCode(500, new ApiResponse<string>(false, "Error interno al procesar la orden", null!));
            }
        }

        if (request.Amount <= 0)
            return BadRequest(new ApiResponse<string>(false, "Amount must be greater than 0", null!));

        try
        {
            // Llamar al servicio de Stripe con la nueva firma
            var charge = await _stripeService.ProcessPaymentAsync(
                request.OrderId,
                supplierId,
                request.StripeToken,
                request.Name ?? "Compra",
                request.Amount,
                request.Email ?? string.Empty,
                request.Currency ?? "usd",
                request.Description
            );

            // Obtener información de balance (fees) si está disponible
            decimal feeAmount = 0m;
            decimal netAmount = request.Amount;
            string? balanceId = charge?.BalanceTransactionId ?? charge?.BalanceTransaction?.Id;

            if (!string.IsNullOrEmpty(balanceId))
            {
                var btService = new BalanceTransactionService();
                var balance = await btService.GetAsync(balanceId);
                // Los valores vienen en la menor unidad (ej. cents)
                feeAmount = (balance?.Fee ?? 0) / 100m;
                netAmount = (balance?.Net ?? 0) / 100m;
            }

            // Crear registro de Payment en la base de datos
            // Asegurarse de que el Supplier existe; si no, usar el proveedor de sistema como fallback
            var supplier = await _db.Suppliers.FindAsync(supplierId);
            if (supplier == null)
            {
                _logger.LogWarning("Supplier with id {SupplierId} not found. Falling back to system supplier.", supplierId);
                var systemSupplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.CompanyName == "Sistema Administrativo");
                if (systemSupplier == null)
                {
                    // Crear proveedor sistema (mínimo campos requeridos) - similar a SeedData
                    systemSupplier = new Supplier
                    {
                        CompanyName = "Sistema Administrativo",
                        LegalName = "Administrador del Sistema",
                        Description = "Proveedor predeterminado del sistema",
                        ContactEmail = "admin@sistema.local",
                        ContactPhone = "000-000-0000",
                        Address = "Sistema",
                        City = "Sistema",
                        Country = "Sistema",
                        PostalCode = "00000",
                        TaxId = "ADMIN-000",
                        BusinessRegistration = "SYSTEM-REG-001",
                        Status = AppConstants.SupplierActive,
                        IsVerified = true,
                        VerifiedAt = DateTime.UtcNow,
                        CommissionRate = 0,
                        OwnerUserId = "system", // usar identificador no nulo
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _db.Suppliers.AddAsync(systemSupplier);
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("System supplier created with id {Id}", systemSupplier.Id);
                }

                supplierId = systemSupplier.Id;
                supplier = systemSupplier;
            }

            var payment = new Models.Payment
            {
                OrderId = request.OrderId,
                SupplierId = supplierId,
                PaymentMethod = "stripe",
                PaymentType = PaymentTypeConstants.Sale,
                TransactionId = charge?.Id ?? Guid.NewGuid().ToString(),
                Amount = request.Amount,
                FeeAmount = feeAmount,
                NetAmount = netAmount,
                Status = (charge != null && charge.Status == "succeeded") ? AppConstants.PaymentPaid : AppConstants.PaymentFailed,
                FailureMessage = charge?.FailureMessage,
                GatewayTransactionId = balanceId,
                Currency = (request.Currency ?? "usd").ToUpper(),
                PaymentDate = DateTime.UtcNow
            };

            // Guardar respuesta cruda en GatewayResponse
            if (charge != null)
            {
                payment.SetGatewayResponse(charge);
            }

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            // Crear settlements por supplier si el pago fue exitoso
            if (payment.IsSuccessful)
            {
                try
                {
                    var itemsBySupplier = await _db.OrderItems
                        .Where(i => i.OrderId == request.OrderId)
                        .GroupBy(i => i.SupplierId)
                        .Select(g => new
                        {
                            SupplierId = g.Key,
                            GrossAmount = g.Sum(i => i.TotalPrice)
                        })
                        .ToListAsync();

                    foreach (var group in itemsBySupplier)
                    {
                        // Obtener el supplier para calcular la comisión
                        // var s = await _db.Suppliers.FindAsync(group.SupplierId);
                        // decimal commissionRate = s?.CommissionRate ?? 0m;
                        // decimal commissionAmount = Math.Round(group.GrossAmount * (commissionRate / 100m), 2);
                        // Usar comisión fija de plataforma: 2% sobre ventas de cada proveedor
                        // (independiente de la CommissionRate almacenada en Supplier)
                        const decimal platformCommissionPercent = 2.0m;
                        decimal commissionAmount = Math.Round(group.GrossAmount * (platformCommissionPercent / 100m), 2);
                        decimal net = Math.Round(group.GrossAmount - commissionAmount, 2);

                        var settlement = new SupplierSettlement
                        {
                            SupplierId = group.SupplierId,
                            OrderId = request.OrderId,
                            PaymentId = payment.Id,
                            GrossAmount = group.GrossAmount,
                            CommissionAmount = commissionAmount,
                            NetAmount = net,
                            Status = "pending",
                            ReferenceTransactionId = payment.TransactionId,
                            CreatedAt = DateTime.UtcNow
                        };

                        _db.SupplierSettlements.Add(settlement);
                    }

                    await _db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating supplier settlements for order {OrderId}", request.OrderId);
                    // No fallamos la operación del pago, pero lo dejamos logueado para resolver manualmente
                }
            }

            var responseDto = new StripePaymentResponse
            {
                TransactionId = payment.TransactionId,
                Amount = payment.Amount,
                FeeAmount = payment.FeeAmount,
                NetAmount = payment.NetAmount,
                Status = payment.Status,
                Currency = payment.Currency ?? "USD",
                GatewayTransactionId = payment.GatewayTransactionId
            };

            return Ok(new ApiResponse<StripePaymentResponse>(true, "Pago procesado con éxito", responseDto));
        }
        catch (StripeException sx)
        {
            _logger.LogError(sx, "StripeException processing payment");
            return StatusCode(502, new ApiResponse<string>(false, sx.StripeError?.Message ?? sx.Message, null!));
        }
        catch (ArgumentException aex)
        {
            _logger.LogWarning(aex, "Invalid payment request");
            return BadRequest(new ApiResponse<string>(false, aex.Message, null!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing payment");
            return StatusCode(500, new ApiResponse<string>(false, "Error interno al procesar el pago", null!));
        }
    }

    // ==================== STRIPE CONNECT ENDPOINTS ====================

    /// <summary>
    /// Crear una cuenta de Stripe Connect para el proveedor actual
    /// </summary>
    [Authorize(Roles = "Proveedor,Administrator,SuperAdmin")]
    [HttpPost("connect/create-account")]
    public async Task<IActionResult> CreateConnectAccount()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));

            // Obtener el proveedor del usuario actual
            var supplier = await _db.Suppliers
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

            if (supplier == null)
                return NotFound(new ApiResponse<string>(false, "No se encontró un proveedor asociado a este usuario", null!));

            // Verificar si ya tiene una cuenta de Stripe
            if (!string.IsNullOrEmpty(supplier.StripeAccountId))
            {
                return Ok(new ApiResponse<object>(true, "El proveedor ya tiene una cuenta de Stripe Connect", new
                {
                    accountId = supplier.StripeAccountId,
                    enabled = supplier.StripeAccountEnabled
                }));
            }

            // Crear cuenta de Stripe Connect con mínima información
            var accountService = new AccountService();
            var accountOptions = new AccountCreateOptions
            {
                Type = "express",
                Country = "US",
                Email = supplier.ContactEmail ?? $"supplier{supplier.Id}@tiendaonline.com"
            };

            // Solo agregar capabilities si es necesario
            accountOptions.Capabilities = new AccountCapabilitiesOptions
            {
                CardPayments = new AccountCapabilitiesCardPaymentsOptions { Requested = true },
                Transfers = new AccountCapabilitiesTransfersOptions { Requested = true }
            };

            var account = await accountService.CreateAsync(accountOptions);

            // Guardar el ID de la cuenta en la base de datos
            supplier.StripeAccountId = account.Id;
            supplier.StripeAccountCreatedAt = DateTime.UtcNow;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            _logger.LogInformation("Stripe Connect account created for supplier {SupplierId}: {AccountId}", 
                supplier.Id, account.Id);

            return Ok(new ApiResponse<object>(true, "Cuenta de Stripe Connect creada exitosamente", new
            {
                accountId = account.Id,
                supplierId = supplier.Id
            }));
        }
        catch (StripeException se)
        {
            _logger.LogError(se, "Error de Stripe al crear cuenta Connect");
            
            // Mensaje específico si Stripe Connect no está habilitado
            if (se.Message.Contains("signed up for Connect") || se.Message.Contains("not enabled"))
            {
                return StatusCode(503, new ApiResponse<string>(false, 
                    "Stripe Connect no está habilitado en tu cuenta. Por favor, activa Stripe Connect en tu Dashboard de Stripe: https://dashboard.stripe.com/settings/connect", 
                    null!));
            }
            
            return StatusCode(502, new ApiResponse<string>(false, 
                $"Error de Stripe: {se.StripeError?.Message ?? se.Message}", null!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear cuenta de Stripe Connect");
            return StatusCode(500, new ApiResponse<string>(false, 
                $"Error interno: {ex.Message}", null!));
        }
    }

    /// <summary>
    /// Obtener el link de onboarding de Stripe para que el proveedor complete su perfil
    /// </summary>
    [Authorize(Roles = "Proveedor,Administrator,SuperAdmin")]
    [HttpGet("connect/onboarding-link")]
    public async Task<IActionResult> GetOnboardingLink([FromQuery] string? returnUrl, [FromQuery] string? refreshUrl)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));

            var supplier = await _db.Suppliers
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

            if (supplier == null)
                return NotFound(new ApiResponse<string>(false, "No se encontró un proveedor asociado a este usuario", null!));

            if (string.IsNullOrEmpty(supplier.StripeAccountId))
                return BadRequest(new ApiResponse<string>(false, "El proveedor no tiene una cuenta de Stripe Connect. Crea una primero.", null!));

            // Crear AccountLink para onboarding
            var accountLinkService = new AccountLinkService();
            var accountLinkOptions = new AccountLinkCreateOptions
            {
                Account = supplier.StripeAccountId,
                RefreshUrl = refreshUrl ?? $"{Request.Scheme}://{Request.Host}/dashboard/supplier?refresh=true",
                ReturnUrl = returnUrl ?? $"{Request.Scheme}://{Request.Host}/dashboard/supplier?success=true",
                Type = "account_onboarding"
            };

            var accountLink = await accountLinkService.CreateAsync(accountLinkOptions);

            return Ok(new ApiResponse<object>(true, "Link de onboarding generado", new
            {
                url = accountLink.Url,
                expiresAt = accountLink.ExpiresAt
            }));
        }
        catch (StripeException se)
        {
            _logger.LogError(se, "Error de Stripe al generar link de onboarding");
            return StatusCode(502, new ApiResponse<string>(false, se.StripeError?.Message ?? se.Message, null!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar link de onboarding");
            return StatusCode(500, new ApiResponse<string>(false, "Error interno al generar el link", null!));
        }
    }

    /// <summary>
    /// Obtener el estado de la cuenta de Stripe Connect del proveedor
    /// </summary>
    [Authorize(Roles = "Proveedor,Administrator,SuperAdmin")]
    [HttpGet("connect/account-status")]
    public async Task<IActionResult> GetAccountStatus()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));

            var supplier = await _db.Suppliers
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

            if (supplier == null)
                return NotFound(new ApiResponse<string>(false, "No se encontró un proveedor asociado a este usuario", null!));

            if (string.IsNullOrEmpty(supplier.StripeAccountId))
            {
                return Ok(new ApiResponse<object>(true, "El proveedor no tiene cuenta de Stripe Connect", new
                {
                    hasAccount = false,
                    accountId = (string?)null,
                    enabled = false,
                    detailsSubmitted = false,
                    chargesEnabled = false,
                    payoutsEnabled = false
                }));
            }

            // Obtener información de la cuenta desde Stripe
            var accountService = new AccountService();
            var account = await accountService.GetAsync(supplier.StripeAccountId);

            // Actualizar el estado en la base de datos
            supplier.StripeAccountEnabled = account.ChargesEnabled && account.PayoutsEnabled;
            supplier.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>(true, "Estado de la cuenta obtenido", new
            {
                hasAccount = true,
                accountId = account.Id,
                enabled = supplier.StripeAccountEnabled,
                detailsSubmitted = account.DetailsSubmitted,
                chargesEnabled = account.ChargesEnabled,
                payoutsEnabled = account.PayoutsEnabled,
                requirements = new
                {
                    currentlyDue = account.Requirements?.CurrentlyDue,
                    eventuallyDue = account.Requirements?.EventuallyDue,
                    pastDue = account.Requirements?.PastDue
                }
            }));
        }
        catch (StripeException se)
        {
            _logger.LogError(se, "Error de Stripe al obtener estado de cuenta");
            return StatusCode(502, new ApiResponse<string>(false, se.StripeError?.Message ?? se.Message, null!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener estado de cuenta");
            return StatusCode(500, new ApiResponse<string>(false, "Error interno al obtener el estado", null!));
        }
    }

    /// <summary>
    /// Crear una sesión de login para el dashboard de Stripe Express
    /// </summary>
    [Authorize(Roles = "Proveedor,Administrator,SuperAdmin")]
    [HttpPost("connect/dashboard-link")]
    public async Task<IActionResult> CreateDashboardLink()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null!));

            var supplier = await _db.Suppliers
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

            if (supplier == null)
                return NotFound(new ApiResponse<string>(false, "No se encontró un proveedor asociado a este usuario", null!));

            if (string.IsNullOrEmpty(supplier.StripeAccountId))
                return BadRequest(new ApiResponse<string>(false, "El proveedor no tiene una cuenta de Stripe Connect", null!));

            // Crear AccountLink para acceder al dashboard de Stripe Express
            var accountLinkService = new AccountLinkService();
            var accountLinkOptions = new AccountLinkCreateOptions
            {
                Account = supplier.StripeAccountId,
                RefreshUrl = $"{Request.Scheme}://{Request.Host}/dashboard/supplier",
                ReturnUrl = $"{Request.Scheme}://{Request.Host}/dashboard/supplier",
                Type = "account_onboarding"
            };
            
            var accountLink = await accountLinkService.CreateAsync(accountLinkOptions);

            return Ok(new ApiResponse<object>(true, "Link al dashboard generado", new
            {
                url = accountLink.Url
            }));
        }
        catch (StripeException se)
        {
            _logger.LogError(se, "Error de Stripe al generar link de dashboard");
            return StatusCode(502, new ApiResponse<string>(false, se.StripeError?.Message ?? se.Message, null!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar link de dashboard");
            return StatusCode(500, new ApiResponse<string>(false, "Error interno al generar el link", null!));
        }
    }
}