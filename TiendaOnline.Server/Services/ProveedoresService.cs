using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Interfaces;
using SupplierModel = TiendaOnline.Server.Models.Supplier;
using TiendaOnline.Server.Models;
using Microsoft.AspNetCore.Identity;


namespace TiendaOnline.Server.Services
{
    public class ProveedoresService : IProveedoresService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProveedoresService> _logger;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProveedoresService(
            ApplicationDbContext context, 
            ILogger<ProveedoresService> logger,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
        }

        public async Task<ApiResponse<IEnumerable<SupplierModel>>> GetAllSuppliersAsync()
        {
            const string operation = "ObtenerTodosProveedores";
            _logger.LogInformation("{Operation}: Iniciando", operation);
            
            try
            {
                var suppliers = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .Include(s => s.Products)
                    .Include(s => s.Managers)
                        .ThenInclude(m => m.ManagerUser)
                    .OrderBy(s => s.CompanyName)
                    .ToListAsync();

                _logger.LogInformation("{Operation}: Completado exitosamente. Encontrados {Count} proveedores", 
                    operation, suppliers.Count);
                
                return new ApiResponse<IEnumerable<SupplierModel>>(true, "Proveedores obtenidos con éxito", suppliers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener proveedores", operation);
                return new ApiResponse<IEnumerable<SupplierModel>>(false, $"Error al obtener proveedores: {ex.Message}", default);
            }
        }

        public async Task<ApiResponse<SupplierModel>> GetSupplierByIdAsync(int id)
        {
            const string operation = "ObtenerProveedorPorId";
            _logger.LogInformation("{Operation}: Buscando proveedor ID {SupplierId}", operation, id);
            
            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .Include(s => s.Products)
                    .Include(s => s.Managers)
                        .ThenInclude(m => m.ManagerUser)
                    .Include(s => s.Orders)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<SupplierModel>(false, $"Proveedor con ID {id} no encontrado", null);
                }

                _logger.LogInformation("{Operation}: Proveedor encontrado - {CompanyName} (ID: {SupplierId})", 
                    operation, supplier.CompanyName, id);
                
                return new ApiResponse<SupplierModel>(true, "Proveedor obtenido con éxito", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<SupplierModel>(false, $"Error al obtener proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> GetSupplierByUserIdAsync(string userId)
        {
            const string operation = "ObtenerProveedorPorUsuario";
            _logger.LogInformation("{Operation}: Buscando proveedor para usuario ID {UserId}", operation, userId);
            
            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.Products)
                    .Include(s => s.Managers)
                    .FirstOrDefaultAsync(s => s.OwnerUserId == userId);

                if (supplier == null)
                {
                    _logger.LogInformation("{Operation}: No se encontró proveedor para el usuario ID {UserId}", operation, userId);
                    return new ApiResponse<SupplierModel>(false, "No se encontró un proveedor para este usuario", null);
                }

                _logger.LogInformation("{Operation}: Proveedor encontrado para usuario - {CompanyName} (Usuario: {UserId})", 
                    operation, supplier.CompanyName, userId);
                
                return new ApiResponse<SupplierModel>(true, "Proveedor obtenido con éxito", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener proveedor para usuario ID {UserId}", operation, userId);
                return new ApiResponse<SupplierModel>(false, $"Error al obtener proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> CreateSupplierAsync(SupplierModel supplier)
        {
            const string operation = "CrearProveedor";
            _logger.LogInformation("{Operation}: Iniciando creación para {CompanyName}", 
                operation, supplier.CompanyName);

            try
            {
                _logger.LogDebug("{Operation}: Validando nombre de compañía: {CompanyName}", 
                    operation, supplier.CompanyName);

                var exists = await _context.Suppliers
                    .AnyAsync(s => s.CompanyName.ToLower() == supplier.CompanyName.ToLower().Trim());

                if (exists)
                {
                    _logger.LogWarning("{Operation}: Ya existe un proveedor con el nombre {CompanyName}", 
                        operation, supplier.CompanyName);
                    return new ApiResponse<SupplierModel>(false, "Ya existe un proveedor con este nombre", null);
                }

                _logger.LogDebug("{Operation}: Validando usuario {UserId}", 
                    operation, supplier.OwnerUserId);

                var userHasSupplier = await _context.Suppliers
                    .AnyAsync(s => s.OwnerUserId == supplier.OwnerUserId);

                if (userHasSupplier)
                {
                    _logger.LogWarning("{Operation}: El usuario {UserId} ya tiene un proveedor registrado", 
                        operation, supplier.OwnerUserId);
                    return new ApiResponse<SupplierModel>(false, "Este usuario ya tiene un proveedor registrado", null);
                }

                // Validar documentos
                if (string.IsNullOrEmpty(supplier.BusinessLicense) || 
                    string.IsNullOrEmpty(supplier.TaxCertificate) || 
                    string.IsNullOrEmpty(supplier.IdDocument))
                {
                    _logger.LogWarning("{Operation}: Faltan documentos requeridos para {CompanyName}", 
                        operation, supplier.CompanyName);
                    return new ApiResponse<SupplierModel>(false, "Todos los documentos son requeridos", null);
                }

                // Asignar valores por defecto
                supplier.CreatedAt = DateTime.UtcNow;
                supplier.Status = AppConstants.SupplierPending; // Queda pendiente hasta aprobación
                supplier.IsVerified = false; // Sin verificar hasta aprobación del admin

                _logger.LogDebug("{Operation}: Agregando proveedor a la base de datos como solicitud pendiente", operation);
                _context.Suppliers.Add(supplier);
                await _context.SaveChangesAsync();

                _logger.LogInformation("{Operation}: Solicitud de proveedor creada con ID {SupplierId} - Usuario {UserId} mantiene rol Cliente hasta aprobación", 
                    operation, supplier.Id, supplier.OwnerUserId);

                // NOTA: NO creamos SupplierManager aquí - se crea solo cuando se aprueba la solicitud
                // El usuario mantiene su rol de Cliente hasta que el SuperAdmin apruebe la solicitud

                return new ApiResponse<SupplierModel>(true, "Solicitud de proveedor enviada con éxito. Mantén tu rol actual hasta la aprobación del administrador.", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: ERROR al crear proveedor {CompanyName}", 
                    operation, supplier.CompanyName);
                return new ApiResponse<SupplierModel>(false, $"Error al crear proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> UpdateSupplierAsync(int id, SupplierModel supplier)
        {
            const string operation = "ActualizarProveedor";
            _logger.LogInformation("{Operation}: Iniciando actualización para proveedor ID {SupplierId}", 
                operation, id);

            try
            {
                if (id != supplier.Id)
                {
                    _logger.LogWarning("{Operation}: ID de proveedor no coincide. Esperado: {ExpectedId}, Recibido: {ReceivedId}", 
                        operation, id, supplier.Id);
                    return new ApiResponse<SupplierModel>(false, "ID de proveedor no coincide", null);
                }

                var existingSupplier = await _context.Suppliers
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (existingSupplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<SupplierModel>(false, $"Proveedor con ID {id} no encontrado", null);
                }

                _logger.LogDebug("{Operation}: Validando nombre único para {CompanyName}", 
                    operation, supplier.CompanyName);

                var nameExists = await _context.Suppliers
                    .AnyAsync(s => s.CompanyName.ToLower() == supplier.CompanyName.ToLower().Trim() && 
                                  s.Id != id);

                if (nameExists)
                {
                    _logger.LogWarning("{Operation}: Ya existe otro proveedor con el nombre {CompanyName}", 
                        operation, supplier.CompanyName);
                    return new ApiResponse<SupplierModel>(false, "Ya existe otro proveedor con este nombre", null);
                }

                _logger.LogDebug("{Operation}: Actualizando propiedades del proveedor ID {SupplierId}", operation, id);

                // Actualizar propiedades
                existingSupplier.CompanyName = supplier.CompanyName.Trim();
                existingSupplier.LegalName = supplier.LegalName?.Trim();
                existingSupplier.Description = supplier.Description?.Trim();
                existingSupplier.Logo = supplier.Logo;
                existingSupplier.Banner = supplier.Banner;
                existingSupplier.ContactEmail = supplier.ContactEmail?.Trim();
                existingSupplier.ContactPhone = supplier.ContactPhone?.Trim();
                existingSupplier.Address = supplier.Address?.Trim();
                existingSupplier.City = supplier.City?.Trim();
                existingSupplier.Country = supplier.Country?.Trim();
                existingSupplier.PostalCode = supplier.PostalCode?.Trim();
                existingSupplier.TaxId = supplier.TaxId?.Trim();
                existingSupplier.BusinessRegistration = supplier.BusinessRegistration?.Trim();
                existingSupplier.CommissionRate = supplier.CommissionRate;
                existingSupplier.PaymentMethod = supplier.PaymentMethod?.Trim();
                existingSupplier.PaymentAccount = supplier.PaymentAccount?.Trim();
                existingSupplier.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("{Operation}: Proveedor ID {SupplierId} actualizado exitosamente", 
                    operation, id);

                return new ApiResponse<SupplierModel>(true, "Proveedor actualizado con éxito", existingSupplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al actualizar proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<SupplierModel>(false, $"Error al actualizar proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<int>> DeleteSupplierAsync(int id)
        {
            const string operation = "EliminarProveedor";
            _logger.LogInformation("{Operation}: Iniciando eliminación para proveedor ID {SupplierId}", operation, id);
            
            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.Products)
                    .Include(s => s.Orders)
                    .Include(s => s.Managers)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<int>(false, $"Proveedor con ID {id} no encontrado", id);
                }

                // Verificar si tiene productos asociados
                if (supplier.Products?.Any() == true)
                {
                    _logger.LogWarning("{Operation}: No se puede eliminar proveedor ID {SupplierId} - Tiene {ProductCount} productos asociados", 
                        operation, id, supplier.Products.Count);
                    return new ApiResponse<int>(false, "No se puede eliminar el proveedor porque tiene productos asociados", id);
                }

                // Verificar si tiene órdenes asociadas
                if (supplier.Orders?.Any() == true)
                {
                    _logger.LogWarning("{Operation}: No se puede eliminar proveedor ID {SupplierId} - Tiene {OrderCount} órdenes asociadas", 
                        operation, id, supplier.Orders.Count);
                    return new ApiResponse<int>(false, "No se puede eliminar el proveedor porque tiene órdenes asociadas", id);
                }

                // Eliminar managers primero
                if (supplier.Managers?.Any() == true)
                {
                    _logger.LogDebug("{Operation}: Eliminando {ManagerCount} managers del proveedor ID {SupplierId}", 
                        operation, supplier.Managers.Count, id);
                    _context.SupplierManagers.RemoveRange(supplier.Managers);
                }

                _context.Suppliers.Remove(supplier);
                await _context.SaveChangesAsync();

                _logger.LogInformation("{Operation}: Proveedor ID {SupplierId} eliminado exitosamente", operation, id);
                return new ApiResponse<int>(true, "Proveedor eliminado con éxito", id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al eliminar proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<int>(false, $"Error al eliminar proveedor: {ex.Message}", id);
            }
        }

        public async Task<ApiResponse<bool>> CheckSupplierExistsAsync(string companyName, int? currentId = null)
        {
            const string operation = "VerificarExistenciaProveedor";
            _logger.LogDebug("{Operation}: Verificando nombre {CompanyName} (CurrentId: {CurrentId})", 
                operation, companyName, currentId);
            
            try
            {
                var query = _context.Suppliers
                    .Where(s => s.CompanyName.ToLower() == companyName.ToLower().Trim());

                if (currentId.HasValue)
                {
                    query = query.Where(s => s.Id != currentId.Value);
                }

                var exists = await query.AnyAsync();

                _logger.LogDebug("{Operation}: Resultado para {CompanyName} - Existe: {Exists}", 
                    operation, companyName, exists);
                
                return new ApiResponse<bool>(true, 
                    exists ? "Ya existe un proveedor con este nombre" : "No existe proveedor con este nombre", 
                    exists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al verificar proveedor {CompanyName}", operation, companyName);
                return new ApiResponse<bool>(false, $"Error al verificar proveedor: {ex.Message}", false);
            }
        }

        public async Task<ApiResponse<IEnumerable<SupplierModel>>> GetActiveSuppliersAsync()
        {
            const string operation = "ObtenerProveedoresActivos";
            _logger.LogInformation("{Operation}: Iniciando", operation);
            
            try
            {
                var suppliers = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .Include(s => s.Products)
                    .Where(s => s.Status == AppConstants.SupplierActive && s.IsVerified)
                    .OrderBy(s => s.CompanyName)
                    .ToListAsync();

                _logger.LogInformation("{Operation}: Completado exitosamente. Encontrados {Count} proveedores activos", 
                    operation, suppliers.Count);
                
                return new ApiResponse<IEnumerable<SupplierModel>>(true, "Proveedores activos obtenidos con éxito", suppliers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener proveedores activos", operation);
                return new ApiResponse<IEnumerable<SupplierModel>>(false, $"Error al obtener proveedores activos: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<IEnumerable<SupplierModel>>> SearchSuppliersAsync(string searchTerm)
        {
            const string operation = "BuscarProveedores";
            _logger.LogInformation("{Operation}: Buscando con término '{SearchTerm}'", operation, searchTerm);
            
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    _logger.LogWarning("{Operation}: Término de búsqueda vacío", operation);
                    return new ApiResponse<IEnumerable<SupplierModel>>(false, "Término de búsqueda requerido", null);
                }

                var suppliers = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .Where(s => s.CompanyName.Contains(searchTerm) ||
                               (s.LegalName != null && s.LegalName.Contains(searchTerm)) ||
                               (s.ContactEmail != null && s.ContactEmail.Contains(searchTerm)) ||
                               (s.ContactPhone != null && s.ContactPhone.Contains(searchTerm)))
                    .OrderBy(s => s.CompanyName)
                    .ToListAsync();

                _logger.LogInformation("{Operation}: Búsqueda completada. Encontrados {Count} proveedores", 
                    operation, suppliers.Count);
                
                return new ApiResponse<IEnumerable<SupplierModel>>(true, "Proveedores encontrados con éxito", suppliers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al buscar proveedores con término '{SearchTerm}'", operation, searchTerm);
                return new ApiResponse<IEnumerable<SupplierModel>>(false, $"Error al buscar proveedores: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> VerifySupplierAsync(int id)
        {
            const string operation = "VerificarProveedor";
            _logger.LogInformation("{Operation}: Verificando proveedor ID {SupplierId}", operation, id);
            
            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .FirstOrDefaultAsync(s => s.Id == id);
                    
                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<SupplierModel>(false, $"Proveedor con ID {id} no encontrado", null);
                }

                // Verificar el proveedor
                supplier.Verify();
                await _context.SaveChangesAsync();

                // IMPORTANTE: Cuando se aprueba el proveedor, el usuario pasa de Cliente a Proveedor
                await AssignSupplierRoleToUser(supplier.OwnerUserId);

                // Crear SupplierManager automáticamente para el propietario (ahora que está aprobado)
                var existingManager = await _context.SupplierManagers
                    .FirstOrDefaultAsync(sm => sm.SupplierId == supplier.Id && sm.ManagerUserId == supplier.OwnerUserId);

                if (existingManager == null)
                {
                    var ownerManager = new SupplierManager
                    {
                        SupplierId = supplier.Id,
                        ManagerUserId = supplier.OwnerUserId,
                        CanManageProducts = true,
                        CanManageOrders = true,
                        CanManageInventory = true,
                        CanManageServices = true,
                        CanViewReports = true,
                        CanManageSettings = true,
                        CanManageManagers = true,
                        CanEditProductPrices = true,
                        CanEditProductStock = true,
                        CanPublishProducts = true,
                        CanManageDiscounts = true,
                        AssignedByUserId = supplier.OwnerUserId, // Se auto-asigna
                        AssignedAt = DateTime.UtcNow,
                        IsActive = true,
                        Notes = "Manager automático creado al aprobar la solicitud de proveedor"
                    };

                    _context.SupplierManagers.Add(ownerManager);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("{Operation}: SupplierManager creado para el propietario del proveedor {SupplierId}", 
                        operation, id);
                }

                _logger.LogInformation("{Operation}: Proveedor ID {SupplierId} verificado exitosamente. Usuario {UserId} ahora es Proveedor", 
                    operation, id, supplier.OwnerUserId);
                return new ApiResponse<SupplierModel>(true, "Proveedor verificado con éxito. El usuario ahora puede gestionar productos.", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al verificar proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<SupplierModel>(false, $"Error al verificar proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> SuspendSupplierAsync(int id)
        {
            const string operation = "SuspenderProveedor";
            _logger.LogInformation("{Operation}: Suspender proveedor ID {SupplierId}", operation, id);
            
            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .FirstOrDefaultAsync(s => s.Id == id);
                    
                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<SupplierModel>(false, $"Proveedor con ID {id} no encontrado", null);
                }

                supplier.Suspend();
                await _context.SaveChangesAsync();

                // Remover rol de Supplier al suspender
                await RemoveSupplierRoleFromUser(supplier.OwnerUserId);

                _logger.LogInformation("{Operation}: Proveedor ID {SupplierId} suspendido exitosamente. Rol removido del usuario {UserId}", 
                    operation, id, supplier.OwnerUserId);
                    
                return new ApiResponse<SupplierModel>(true, "Proveedor suspendido con éxito", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al suspender proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<SupplierModel>(false, $"Error al suspender proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierModel>> ActivateSupplierAsync(int id)
        {
            const string operation = "ActivarProveedor";
            _logger.LogInformation("{Operation}: Activando proveedor ID {SupplierId}", operation, id);

            try
            {
                var supplier = await _context.Suppliers
                    .Include(s => s.OwnerUser)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, id);
                    return new ApiResponse<SupplierModel>(false, $"Proveedor con ID {id} no encontrado", null);
                }

                supplier.Activate();
                await _context.SaveChangesAsync();

                // Asignar rol de Supplier al activar
                await AssignSupplierRoleToUser(supplier.OwnerUserId);

                _logger.LogInformation("{Operation}: Proveedor ID {SupplierId} activado exitosamente. Rol asignado al usuario {UserId}",
                    operation, id, supplier.OwnerUserId);

                return new ApiResponse<SupplierModel>(true, "Proveedor activado con éxito", supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al activar proveedor ID {SupplierId}", operation, id);
                return new ApiResponse<SupplierModel>(false, $"Error al activar proveedor: {ex.Message}", null);
            }
        }

        // Métodos auxiliares para gestión de roles
        private async Task AssignSupplierRoleToUser(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Usuario {UserId} no encontrado para asignar rol Supplier", userId);
                    return;
                }

                // Verificar si ya tiene el rol
                var hasRole = await _userManager.IsInRoleAsync(user, AppConstants.SupplierRole);
                if (!hasRole)
                {
                    var result = await _userManager.AddToRoleAsync(user, AppConstants.SupplierRole);
                    if (result.Succeeded)
                    {
                        _logger.LogInformation("Rol Supplier asignado exitosamente al usuario {UserId}", userId);
                    }
                    else
                    {
                        _logger.LogWarning("Error al asignar rol Supplier al usuario {UserId}: {Errors}",
                            userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    _logger.LogDebug("Usuario {UserId} ya tiene el rol Supplier", userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al asignar rol Supplier al usuario {UserId}", userId);
            }
        }
        
        private async Task RemoveSupplierRoleFromUser(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Usuario {UserId} no encontrado para remover rol Supplier", userId);
                    return;
                }

                // Verificar si tiene el rol
                var hasRole = await _userManager.IsInRoleAsync(user, AppConstants.SupplierRole);
                if (hasRole)
                {
                    var result = await _userManager.RemoveFromRoleAsync(user, AppConstants.SupplierRole);
                    if (result.Succeeded)
                    {
                        _logger.LogInformation("Rol Supplier removido exitosamente del usuario {UserId}", userId);
                    }
                    else
                    {
                        _logger.LogWarning("Error al remover rol Supplier del usuario {UserId}: {Errors}", 
                            userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    _logger.LogDebug("Usuario {UserId} no tiene el rol Supplier", userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al remover rol Supplier del usuario {UserId}", userId);
            }
        }

        public async Task<ApiResponse<IEnumerable<Product>>> GetSupplierProductsAsync(int supplierId)
        {
            const string operation = "ObtenerProductosProveedor";
            _logger.LogInformation("{Operation}: Obteniendo productos para proveedor ID {SupplierId}", operation, supplierId);
            
            try
            {
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Reviews)
                    .Where(p => p.SupplierId == supplierId && p.IsPublished)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("{Operation}: Obtenidos {Count} productos para proveedor ID {SupplierId}", 
                    operation, products.Count, supplierId);
                
                return new ApiResponse<IEnumerable<Product>>(true, "Productos del proveedor obtenidos con éxito", products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener productos del proveedor ID {SupplierId}", operation, supplierId);
                return new ApiResponse<IEnumerable<Product>>(false, $"Error al obtener productos del proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<IEnumerable<SupplierManager>>> GetSupplierManagersAsync(int supplierId)
        {
            const string operation = "ObtenerGestoresProveedor";
            _logger.LogInformation("{Operation}: Obteniendo gestores para proveedor ID {SupplierId}", operation, supplierId);
            
            try
            {
                var managers = await _context.SupplierManagers
                    .Include(m => m.ManagerUser)
                    .Include(m => m.AssignedByUser)
                    .Where(m => m.SupplierId == supplierId && m.IsActive)
                    .OrderByDescending(m => m.AssignedAt)
                    .ToListAsync();

                _logger.LogInformation("{Operation}: Obtenidos {Count} gestores para proveedor ID {SupplierId}", 
                    operation, managers.Count, supplierId);
                
                return new ApiResponse<IEnumerable<SupplierManager>>(true, "Gestores del proveedor obtenidos con éxito", managers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al obtener gestores del proveedor ID {SupplierId}", operation, supplierId);
                return new ApiResponse<IEnumerable<SupplierManager>>(false, $"Error al obtener gestores del proveedor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<SupplierManager>> AddManagerToSupplierAsync(int supplierId, SupplierManager manager)
        {
            const string operation = "AgregarGestorProveedor";
            _logger.LogInformation("{Operation}: Agregando gestor al proveedor ID {SupplierId}", operation, supplierId);
            
            try
            {
                // Verificar que el proveedor existe
                var supplier = await _context.Suppliers.FindAsync(supplierId);
                if (supplier == null)
                {
                    _logger.LogWarning("{Operation}: Proveedor con ID {SupplierId} no encontrado", operation, supplierId);
                    return new ApiResponse<SupplierManager>(false, $"Proveedor con ID {supplierId} no encontrado", null);
                }

                // Verificar que el usuario no sea ya manager de este proveedor
                var existingManager = await _context.SupplierManagers
                    .FirstOrDefaultAsync(m => m.SupplierId == supplierId && m.ManagerUserId == manager.ManagerUserId);

                if (existingManager != null)
                {
                    _logger.LogWarning("{Operation}: El usuario {ManagerUserId} ya es gestor del proveedor ID {SupplierId}", 
                        operation, manager.ManagerUserId, supplierId);
                    return new ApiResponse<SupplierManager>(false, "Este usuario ya es gestor de este proveedor", null);
                }

                // Asignar valores
                manager.SupplierId = supplierId;
                manager.AssignedAt = DateTime.UtcNow;
                manager.IsActive = true;

                _context.SupplierManagers.Add(manager);
                await _context.SaveChangesAsync();

                // Cargar relaciones para la respuesta
                await _context.Entry(manager)
                    .Reference(m => m.ManagerUser)
                    .LoadAsync();
                await _context.Entry(manager)
                    .Reference(m => m.AssignedByUser)
                    .LoadAsync();

                _logger.LogInformation("{Operation}: Gestor agregado exitosamente al proveedor ID {SupplierId}", operation, supplierId);
                return new ApiResponse<SupplierManager>(true, "Gestor agregado con éxito", manager);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al agregar gestor al proveedor ID {SupplierId}", operation, supplierId);
                return new ApiResponse<SupplierManager>(false, $"Error al agregar gestor: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<bool>> RemoveManagerFromSupplierAsync(int supplierId, string managerUserId)
        {
            const string operation = "EliminarGestorProveedor";
            _logger.LogInformation("{Operation}: Eliminando gestor {ManagerUserId} del proveedor ID {SupplierId}", 
                operation, managerUserId, supplierId);
            
            try
            {
                var manager = await _context.SupplierManagers
                    .FirstOrDefaultAsync(m => m.SupplierId == supplierId && 
                                            m.ManagerUserId == managerUserId && 
                                            m.IsActive);

                if (manager == null)
                {
                    _logger.LogWarning("{Operation}: Gestor {ManagerUserId} no encontrado para proveedor ID {SupplierId}", 
                        operation, managerUserId, supplierId);
                    return new ApiResponse<bool>(false, "Gestor no encontrado", false);
                }

                // No permitir eliminar al dueño
                if (manager.ManagerUserId == manager.Supplier.OwnerUserId)
                {
                    _logger.LogWarning("{Operation}: Intento de eliminar al dueño del proveedor ID {SupplierId}", 
                        operation, supplierId);
                    return new ApiResponse<bool>(false, "No se puede eliminar al dueño del proveedor", false);
                }

                manager.Deactivate();
                await _context.SaveChangesAsync();

                _logger.LogInformation("{Operation}: Gestor {ManagerUserId} eliminado exitosamente del proveedor ID {SupplierId}", 
                    operation, managerUserId, supplierId);
                return new ApiResponse<bool>(true, "Gestor eliminado con éxito", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Operation}: Error al eliminar gestor {ManagerUserId} del proveedor ID {SupplierId}", 
                    operation, managerUserId, supplierId);
                return new ApiResponse<bool>(false, $"Error al eliminar gestor: {ex.Message}", false);
            }
        }
    }
}
