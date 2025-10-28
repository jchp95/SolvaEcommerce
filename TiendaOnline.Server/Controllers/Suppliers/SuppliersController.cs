using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaOnline.Server.Interfaces;
using TiendaOnline.Server.Models;
using Microsoft.Extensions.Logging;
using TiendaOnline.Server.DTO.Supplier;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;
        private readonly ILogger<SuppliersController> _logger;

        public SuppliersController(ISupplierService supplierService, ILogger<SuppliersController> logger)
        {
            _supplierService = supplierService;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los proveedores
        /// </summary>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Supplier>>>> GetSuppliers()
        {
            _logger.LogInformation("Obteniendo todos los proveedores - Usuario: {UserId}", 
                User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            
            try
            {
                var result = await _supplierService.GetAllSuppliersAsync();
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al obtener proveedores: {ErrorMessage}", result.Message);
                    return StatusCode(500, result);
                }

                _logger.LogInformation("Proveedores obtenidos exitosamente. Total: {Count}", result.Data?.Count() ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener proveedores");
                return StatusCode(500, new ApiResponse<IEnumerable<Supplier>>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Obtiene un proveedor específico por ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Supplier>>> GetSupplier(int id)
        {
            _logger.LogInformation("Obteniendo proveedor con ID: {SupplierId} - Usuario: {UserId}", 
                id, User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            
            try
            {
                var result = await _supplierService.GetSupplierByIdAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Proveedor no encontrado: ID {SupplierId}", id);
                    return NotFound(result);
                }

                _logger.LogInformation("Proveedor obtenido exitosamente: {CompanyName}", result.Data?.CompanyName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener proveedor con ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<Supplier>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Obtiene el proveedor del usuario actual
        /// </summary>
        [HttpGet("my-supplier")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SupplierResponseDto>>> GetMySupplier()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Intento de acceso no autorizado a my-supplier");
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", null));
            }

            _logger.LogInformation("Obteniendo proveedor del usuario: {UserId}", userId);
            
            try
            {
                var result = await _supplierService.GetSupplierByUserIdAsync(userId);
                
                if (!result.Success)
                {
                    _logger.LogInformation("No se encontró proveedor para el usuario: {UserId}", userId);
                    return NotFound(result);
                }

                var supplier = result.Data;
                var supplierDto = new SupplierResponseDto
                {
                    Id = supplier.Id,
                    CompanyName = supplier.CompanyName,
                    LegalName = supplier.LegalName,
                    Description = supplier.Description,
                    ContactEmail = supplier.ContactEmail,
                    ContactPhone = supplier.ContactPhone,
                    Address = supplier.Address,
                    City = supplier.City,
                    Country = supplier.Country,
                    PostalCode = supplier.PostalCode,
                    BusinessRegistration = supplier.BusinessRegistration,
                    Logo = supplier.Logo,
                    Banner = supplier.Banner,
                    Status = supplier.Status,
                    CreatedAt = supplier.CreatedAt,
                    UpdatedAt = supplier.UpdatedAt,
                    OwnerUserId = supplier.OwnerUserId,
                    BusinessLicense = supplier.BusinessLicense,
                    TaxCertificate = supplier.TaxCertificate,
                    IdDocument = supplier.IdDocument
                };

                _logger.LogInformation("Proveedor del usuario obtenido exitosamente: {CompanyName}", supplier.CompanyName);
                return Ok(new ApiResponse<SupplierResponseDto>(true, result.Message, supplierDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener proveedor del usuario {UserId}", userId);
                return StatusCode(500, new ApiResponse<SupplierResponseDto>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Crea un nuevo proveedor
        /// </summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SupplierCreatedDto>>> PostSupplier([FromForm] SupplierCreateDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Intento de crear proveedor sin autenticación");
                return Unauthorized(new ApiResponse<Supplier>(false, "Usuario no autenticado", new Supplier()));
            }

            // FLUJO DE NEGOCIO: Solo usuarios con rol 'Cliente' pueden solicitar ser proveedores
            if (!User.IsInRole(AppConstants.CustomerRole) && !User.IsInRole(AppConstants.SuperAdminRole))
            {
                _logger.LogWarning("Usuario {UserId} sin rol Cliente intentando crear proveedor", userId);
                return BadRequest(new ApiResponse<Supplier>(false, "Solo usuarios con rol Cliente pueden solicitar ser proveedores", new Supplier()));
            }

            _logger.LogInformation("Usuario {UserId} (rol Cliente) intentando crear solicitud de proveedor: {CompanyName}", userId, dto.CompanyName);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Datos de entrada inválidos para crear proveedor: {Errors}", 
                    string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return BadRequest(new ApiResponse<Supplier>(false, "Datos de entrada inválidos", new Supplier()));
            }

            // Procesar archivos PDF
            var files = Request.Form.Files;
            string? businessLicensePath = null;
            string? taxCertificatePath = null;
            string? idDocumentPath = null;
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "suppliers");
            
            try
            {
                Directory.CreateDirectory(uploadDir);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear directorio de uploads: {UploadDir}", uploadDir);
                return StatusCode(500, new ApiResponse<Supplier>(false, "Error al configurar el sistema de archivos", new Supplier()));
            }

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    try
                    {
                        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                        var filePath = Path.Combine(uploadDir, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        
                        if (file.Name == "businessLicense") businessLicensePath = $"/uploads/suppliers/{fileName}";
                        if (file.Name == "taxCertificate") taxCertificatePath = $"/uploads/suppliers/{fileName}";
                        if (file.Name == "idDocument") idDocumentPath = $"/uploads/suppliers/{fileName}";
                        
                        _logger.LogDebug("Archivo subido exitosamente: {FileName} -> {FilePath}", file.FileName, filePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al subir archivo: {FileName}", file.FileName);
                        return StatusCode(500, new ApiResponse<Supplier>(false, $"Error al subir archivo: {file.FileName}", new Supplier()));
                    }
                }
            }

            // Validar que se hayan subido todos los documentos requeridos
            if (string.IsNullOrEmpty(businessLicensePath) ||
                string.IsNullOrEmpty(taxCertificatePath) ||
                string.IsNullOrEmpty(idDocumentPath))
            {
                _logger.LogWarning("Faltan documentos requeridos para crear proveedor {CompanyName}", dto.CompanyName);
                return BadRequest(new ApiResponse<Supplier>(false, "Todos los documentos son requeridos", new Supplier()));
            }

            // Mapear DTO a modelo Supplier - incluyendo las rutas de los documentos
            var supplier = new Supplier
            {
                CompanyName = dto.CompanyName.Trim(),
                LegalName = dto.LegalName?.Trim(),
                Description = dto.Description?.Trim(),
                ContactEmail = dto.ContactEmail?.Trim(),
                ContactPhone = dto.ContactPhone?.Trim(),
                Address = dto.Address?.Trim(),
                City = dto.City?.Trim(),
                Country = dto.Country?.Trim(),
                PostalCode = dto.PostalCode?.Trim(),
                BusinessRegistration = dto.BusinessRegistration?.Trim(),
                OwnerUserId = userId,
                BusinessLicense = businessLicensePath,
                TaxCertificate = taxCertificatePath,
                IdDocument = idDocumentPath,
                Status = AppConstants.SupplierPending,
                IsVerified = false
            };

            var result = await _supplierService.CreateSupplierAsync(supplier);

            if (!result.Success)
            {
                _logger.LogWarning("Error al crear proveedor {CompanyName}: {ErrorMessage}", dto.CompanyName, result.Message);
                
                // Limpiar archivos subidos si falla la creación
                if (!string.IsNullOrEmpty(businessLicensePath))
                    DeleteFile(businessLicensePath);
                if (!string.IsNullOrEmpty(taxCertificatePath))
                    DeleteFile(taxCertificatePath);
                if (!string.IsNullOrEmpty(idDocumentPath))
                    DeleteFile(idDocumentPath);

                return BadRequest(new ApiResponse<Supplier>(false, result.Message, new Supplier()));
            }

            // Proyectar a DTO de respuesta para evitar ciclos
            var createdDto = new SupplierCreatedDto
            {
                Id = result.Data.Id,
                CompanyName = result.Data.CompanyName,
                Status = result.Data.Status
            };
            
            _logger.LogInformation("Solicitud de proveedor creada exitosamente: {CompanyName} (ID: {SupplierId})", 
                result.Data.CompanyName, result.Data.Id);
                
            return CreatedAtAction(nameof(GetSupplier), new { id = createdDto.Id }, 
                new ApiResponse<SupplierCreatedDto>(true, "Solicitud de proveedor enviada exitosamente. Mantén tu rol de Cliente hasta que sea aprobada por el administrador.", createdDto));
        }

        /// <summary>
        /// Obtiene un documento de proveedor
        /// </summary>
        [HttpGet("{id}/documents/{documentType}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSupplierDocument(int id, string documentType)
        {
            _logger.LogInformation("Solicitando documento {DocumentType} del proveedor ID {SupplierId}", documentType, id);
            
            try
            {
                var supplierResult = await _supplierService.GetSupplierByIdAsync(id);
                if (!supplierResult.Success)
                {
                    _logger.LogWarning("Proveedor no encontrado al solicitar documento: ID {SupplierId}", id);
                    return NotFound();
                }

                string? filePath = documentType.ToLower() switch
                {
                    "businesslicense" => supplierResult.Data.BusinessLicense,
                    "taxcertificate" => supplierResult.Data.TaxCertificate,
                    "iddocument" => supplierResult.Data.IdDocument,
                    _ => null
                };

                if (string.IsNullOrEmpty(filePath))
                {
                    _logger.LogWarning("Documento {DocumentType} no encontrado para proveedor ID {SupplierId}", documentType, id);
                    return NotFound("Documento no encontrado");
                }

                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath.TrimStart('/'));
                
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning("Archivo físico no encontrado: {FullPath}", fullPath);
                    return NotFound("Archivo no encontrado");
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                var contentType = "application/pdf";
                var fileName = Path.GetFileName(fullPath);

                _logger.LogInformation("Documento {DocumentType} entregado exitosamente para proveedor ID {SupplierId}", 
                    documentType, id);
                    
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener documento {DocumentType} del proveedor ID {SupplierId}", 
                    documentType, id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualiza un proveedor existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SupplierResponseDto>>> UpdateSupplier(int id, [FromBody] SupplierUpdateDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} intentando actualizar proveedor ID: {SupplierId}", userId, id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Datos de entrada inválidos para actualizar proveedor ID {SupplierId}", id);
                return BadRequest(new ApiResponse<SupplierResponseDto>(false, "Datos de entrada inválidos", null));
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("ID de ruta {RouteId} no coincide con ID de cuerpo {BodyId}", id, dto.Id);
                return BadRequest(new ApiResponse<SupplierResponseDto>(false, "ID en la ruta no coincide con el ID en el cuerpo", null));
            }

            try
            {
                // Obtener el proveedor existente
                var existingSupplierResult = await _supplierService.GetSupplierByIdAsync(id);
                if (!existingSupplierResult.Success)
                {
                    _logger.LogWarning("Proveedor no encontrado para actualización: ID {SupplierId}", id);
                    return NotFound(existingSupplierResult);
                }

                var existingSupplier = existingSupplierResult.Data;

                // Verificar permisos: solo el dueño o un administrador puede actualizar
                var userRoles = User.Claims
                    .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList();

                bool isOwner = existingSupplier.OwnerUserId == userId;
                bool isAdmin = userRoles.Contains(AppConstants.SuperAdminRole) || userRoles.Contains("Admin");

                if (!isOwner && !isAdmin)
                {
                    _logger.LogWarning("Usuario {UserId} no tiene permisos para actualizar proveedor ID {SupplierId}", userId, id);
                    return Forbid();
                }

                // Mapear DTO a entidad Supplier
                var supplierToUpdate = new Supplier
                {
                    Id = dto.Id,
                    CompanyName = dto.CompanyName.Trim(),
                    LegalName = dto.LegalName?.Trim(),
                    Description = dto.Description?.Trim(),
                    Logo = dto.Logo,
                    Banner = dto.Banner,
                    ContactEmail = dto.ContactEmail?.Trim(),
                    ContactPhone = dto.ContactPhone?.Trim(),
                    Address = dto.Address?.Trim(),
                    City = dto.City?.Trim(),
                    Country = dto.Country?.Trim(),
                    PostalCode = dto.PostalCode?.Trim(),
                    TaxId = dto.TaxId?.Trim(),
                    BusinessRegistration = dto.BusinessRegistration?.Trim(),
                    CommissionRate = dto.CommissionRate,
                    PaymentMethod = dto.PaymentMethod?.Trim(),
                    PaymentAccount = dto.PaymentAccount?.Trim(),
                    UpdatedAt = DateTime.UtcNow,
                    // Mantener estos valores del proveedor existente
                    OwnerUserId = existingSupplier.OwnerUserId,
                    Status = existingSupplier.Status,
                    IsVerified = existingSupplier.IsVerified,
                    CreatedAt = existingSupplier.CreatedAt,
                    BusinessLicense = existingSupplier.BusinessLicense,
                    TaxCertificate = existingSupplier.TaxCertificate,
                    IdDocument = existingSupplier.IdDocument
                };

                var result = await _supplierService.UpdateSupplierAsync(id, supplierToUpdate);

                if (!result.Success)
                {
                    _logger.LogWarning("Error al actualizar proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(new ApiResponse<SupplierResponseDto>(false, result.Message, null));
                }

                // Mapear a DTO de respuesta para evitar ciclos
                var updatedSupplier = result.Data;
                var supplierDto = new SupplierResponseDto
                {
                    Id = updatedSupplier.Id,
                    CompanyName = updatedSupplier.CompanyName,
                    LegalName = updatedSupplier.LegalName,
                    Description = updatedSupplier.Description,
                    ContactEmail = updatedSupplier.ContactEmail,
                    ContactPhone = updatedSupplier.ContactPhone,
                    Address = updatedSupplier.Address,
                    City = updatedSupplier.City,
                    Country = updatedSupplier.Country,
                    PostalCode = updatedSupplier.PostalCode,
                    BusinessRegistration = updatedSupplier.BusinessRegistration,
                    Logo = updatedSupplier.Logo,
                    Banner = updatedSupplier.Banner,
                    Status = updatedSupplier.Status,
                    CreatedAt = updatedSupplier.CreatedAt,
                    UpdatedAt = updatedSupplier.UpdatedAt,
                    OwnerUserId = updatedSupplier.OwnerUserId,
                    BusinessLicense = updatedSupplier.BusinessLicense,
                    TaxCertificate = updatedSupplier.TaxCertificate,
                    IdDocument = updatedSupplier.IdDocument
                };

                _logger.LogInformation("Proveedor actualizado exitosamente: {CompanyName} (ID: {SupplierId})", 
                    updatedSupplier.CompanyName, id);

                return Ok(new ApiResponse<SupplierResponseDto>(true, result.Message, supplierDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al actualizar proveedor con ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<SupplierResponseDto>(false, "Error interno del servidor al actualizar proveedor", null));
            }
        }

        // Método helper para eliminar archivos
        private void DeleteFile(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    _logger.LogDebug("Archivo eliminado: {FilePath}", filePath);
                }
                else
                {
                    _logger.LogWarning("Archivo no encontrado para eliminar: {FilePath}", filePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar archivo: {FilePath}", filePath);
            }
        }

        /// <summary>
        /// Elimina un proveedor específico
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<int>>> DeleteSupplier(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} intentando eliminar proveedor ID: {SupplierId}", userId, id);
            
            try
            {
                var result = await _supplierService.DeleteSupplierAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al eliminar proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Proveedor eliminado exitosamente: ID {SupplierId}", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al eliminar proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<int>(false, "Error interno del servidor", id));
            }
        }

        /// <summary>
        /// Verifica si un proveedor ya existe
        /// </summary>
        [HttpGet("check-exists")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(409)]
        public async Task<ActionResult<ApiResponse<bool>>> CheckSupplierExists(
            [FromQuery] string companyName,
            [FromQuery] int? currentId = null)
        {
            _logger.LogInformation("Verificando existencia de proveedor: {CompanyName} (CurrentId: {CurrentId})", 
                companyName, currentId);
            
            try
            {
                var result = await _supplierService.CheckSupplierExistsAsync(companyName, currentId);
                
                if (result.Data)
                {
                    _logger.LogInformation("Proveedor ya existe: {CompanyName}", companyName);
                    return Conflict(result);
                }

                _logger.LogInformation("Proveedor no existe: {CompanyName}", companyName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar existencia de proveedor: {CompanyName}", companyName);
                return StatusCode(500, new ApiResponse<bool>(false, "Error interno del servidor", false));
            }
        }

        /// <summary>
        /// Obtiene proveedores activos
        /// </summary>
        [HttpGet("active")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Supplier>>>> GetActiveSuppliers()
        {
            _logger.LogInformation("Obteniendo proveedores activos");
            
            try
            {
                var result = await _supplierService.GetActiveSuppliersAsync();
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al obtener proveedores activos: {ErrorMessage}", result.Message);
                    return StatusCode(500, result);
                }

                _logger.LogInformation("Proveedores activos obtenidos exitosamente. Total: {Count}", result.Data?.Count() ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener proveedores activos");
                return StatusCode(500, new ApiResponse<IEnumerable<Supplier>>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Busca proveedores por término de búsqueda
        /// </summary>
        [HttpGet("search")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Supplier>>>> SearchSuppliers(
            [FromQuery] string term)
        {
            _logger.LogInformation("Buscando proveedores con término: {SearchTerm}", term);
            
            if (string.IsNullOrWhiteSpace(term))
            {
                _logger.LogWarning("Término de búsqueda vacío");
                return BadRequest(new ApiResponse<string>(false, "Término de búsqueda requerido", ""));
            }

            try
            {
                var result = await _supplierService.SearchSuppliersAsync(term);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al buscar proveedores: {ErrorMessage}", result.Message);
                    return StatusCode(500, result);
                }

                _logger.LogInformation("Búsqueda completada. Encontrados {Count} proveedores", result.Data?.Count() ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al buscar proveedores con término: {SearchTerm}", term);
                return StatusCode(500, new ApiResponse<IEnumerable<Supplier>>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Verifica un proveedor
        /// </summary>
        [HttpPost("{id}/verify")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Supplier>>> VerifySupplier(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} verificando proveedor ID: {SupplierId}", userId, id);
            
            try
            {
                var result = await _supplierService.VerifySupplierAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al verificar proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Proveedor verificado exitosamente: ID {SupplierId}", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al verificar proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<Supplier>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Suspende un proveedor
        /// </summary>
        [HttpPost("{id}/suspend")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Supplier>>> SuspendSupplier(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} suspendiendo proveedor ID: {SupplierId}", userId, id);
            
            try
            {
                var result = await _supplierService.SuspendSupplierAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al suspender proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Proveedor suspendido exitosamente: ID {SupplierId}", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al suspender proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<Supplier>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Activa un proveedor
        /// </summary>
        [HttpPost("{id}/activate")]
        [Authorize(Roles = AppConstants.SuperAdminRole)]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<Supplier>>> ActivateSupplier(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();
            
            _logger.LogInformation("=== ACTIVAR PROVEEDOR - DEBUG INFO ===");
            _logger.LogInformation("Usuario ID: {UserId}", userId);
            _logger.LogInformation("Usuario Email: {UserEmail}", userEmail);
            _logger.LogInformation("Roles del usuario: {UserRoles}", string.Join(", ", userRoles));
            _logger.LogInformation("Rol requerido: {RequiredRole}", AppConstants.SuperAdminRole);
            _logger.LogInformation("Usuario autenticado: {IsAuthenticated}", User.Identity?.IsAuthenticated);
            _logger.LogInformation("=== FIN DEBUG INFO ===");

            if (!User.Identity?.IsAuthenticated ?? true)
            {
                _logger.LogWarning("Usuario no autenticado intentando activar proveedor");
                return Unauthorized(new ApiResponse<Supplier>(false, "Usuario no autenticado", null));
            }

            if (!userRoles.Contains(AppConstants.SuperAdminRole))
            {
                _logger.LogWarning("Usuario sin permisos intentando activar proveedor. Roles: {UserRoles}", string.Join(", ", userRoles));
                return Forbid();
            }

            try
            {
                var result = await _supplierService.ActivateSupplierAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al activar proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Proveedor activado exitosamente: ID {SupplierId}", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al activar proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<Supplier>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Obtiene los productos de un proveedor
        /// </summary>
        [HttpGet("{id}/products")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<Product>>>> GetSupplierProducts(int id)
        {
            _logger.LogInformation("Obteniendo productos del proveedor ID: {SupplierId}", id);
            
            try
            {
                var result = await _supplierService.GetSupplierProductsAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al obtener productos del proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return NotFound(result);
                }

                _logger.LogInformation("Productos obtenidos exitosamente para proveedor ID {SupplierId}. Total: {Count}", 
                    id, result.Data?.Count() ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener productos del proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<IEnumerable<Product>>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Obtiene los gestores de un proveedor
        /// </summary>
        [HttpGet("{id}/managers")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<SupplierManager>>>> GetSupplierManagers(int id)
        {
            _logger.LogInformation("Obteniendo gestores del proveedor ID: {SupplierId}", id);
            
            try
            {
                var result = await _supplierService.GetSupplierManagersAsync(id);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al obtener gestores del proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return NotFound(result);
                }

                _logger.LogInformation("Gestores obtenidos exitosamente para proveedor ID {SupplierId}. Total: {Count}", 
                    id, result.Data?.Count() ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al obtener gestores del proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<IEnumerable<SupplierManager>>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Agrega un gestor a un proveedor
        /// </summary>
        [HttpPost("{id}/managers")]
        [Authorize]
        [ProducesResponseType(201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SupplierManager>>> AddManager(int id, SupplierManager manager)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} agregando gestor al proveedor ID: {SupplierId}", userId, id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Datos de entrada inválidos para agregar gestor al proveedor ID {SupplierId}", id);
                return BadRequest(new ApiResponse<string>(false, "Datos de entrada inválidos", null));
            }

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Usuario no autenticado intentando agregar gestor");
                return Unauthorized(new ApiResponse<string>(false, "Usuario no autenticado", ""));
            }

            manager.AssignedByUserId = userId;

            try
            {
                var result = await _supplierService.AddManagerToSupplierAsync(id, manager);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Error al agregar gestor al proveedor ID {SupplierId}: {ErrorMessage}", id, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Gestor agregado exitosamente al proveedor ID {SupplierId}", id);
                return CreatedAtAction(nameof(GetSupplierManagers), new { id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al agregar gestor al proveedor ID {SupplierId}", id);
                return StatusCode(500, new ApiResponse<SupplierManager>(false, "Error interno del servidor", null));
            }
        }

        /// <summary>
        /// Elimina un gestor de un proveedor
        /// </summary>
        [HttpDelete("{supplierId}/managers/{managerUserId}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<bool>>> RemoveManager(int supplierId, string managerUserId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Usuario {UserId} eliminando gestor {ManagerUserId} del proveedor ID: {SupplierId}", 
                userId, managerUserId, supplierId);

            try
            {
                var result = await _supplierService.RemoveManagerFromSupplierAsync(supplierId, managerUserId);

                if (!result.Success)
                {
                    _logger.LogWarning("Error al eliminar gestor {ManagerUserId} del proveedor ID {SupplierId}: {ErrorMessage}", 
                        managerUserId, supplierId, result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Gestor {ManagerUserId} eliminado exitosamente del proveedor ID {SupplierId}", 
                    managerUserId, supplierId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al eliminar gestor {ManagerUserId} del proveedor ID {SupplierId}", 
                    managerUserId, supplierId);
                return StatusCode(500, new ApiResponse<bool>(false, "Error interno del servidor", false));
            }
        }
    }
}