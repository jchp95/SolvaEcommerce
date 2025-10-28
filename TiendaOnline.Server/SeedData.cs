using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using (var scope = serviceProvider.CreateScope())
        {
            var services = scope.ServiceProvider;
            
            try
            {
                var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
                var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
                var configuration = services.GetRequiredService<IConfiguration>();
                var context = services.GetRequiredService<ApplicationDbContext>();

                // Asegurar que la base de datos esté creada
                await context.Database.MigrateAsync();

                // Roles a crear (ordenados por nivel de privilegio)
                var roles = new[]
                {
                    new { Name = "SuperAdmin", Description = "Acceso total al sistema", RoleType = "System" },
                    new { Name = "Proveedor", Description = "Gestión de productos y servicios propios", RoleType = "Business" },
                    new { Name = "Gestor", Description = "Gestión de contenido y operaciones", RoleType = "Business" },
                    new { Name = "Cliente", Description = "Usuarios registrados que pueden comprar", RoleType = "Business" },
                    new { Name = "Visitante", Description = "Usuarios no autenticados", RoleType = "System" }
                };

                // Crear roles si no existen
                foreach (var roleInfo in roles)
                {
                    var roleExist = await roleManager.RoleExistsAsync(roleInfo.Name);
                    if (!roleExist)
                    {
                        var role = new ApplicationRole
                        {
                            Name = roleInfo.Name,
                            NormalizedName = roleInfo.Name.ToUpper(),
                            Description = roleInfo.Description,
                            RoleType = roleInfo.RoleType,
                            CreatedAt = DateTime.UtcNow
                        };
                        await roleManager.CreateAsync(role);
                        Console.WriteLine($"Rol creado: {roleInfo.Name}");
                    }
                }

                // Crear usuario SuperAdmin por defecto (desde configuración)
                var superAdminEmail = configuration["SuperAdmin:Email"] ?? "superadmin@tienda.com";
                var superAdminPassword = configuration["SuperAdmin:Password"] ?? "SuperAdmin@123";

                var superAdminUser = await userManager.FindByEmailAsync(superAdminEmail);

                if (superAdminUser == null)
                {
                    superAdminUser = new ApplicationUser
                    {
                        UserName = superAdminEmail,
                        Email = superAdminEmail,
                        EmailConfirmed = true,
                        FirstName = "Super",
                        LastName = "Administrador",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    var createResult = await userManager.CreateAsync(superAdminUser, superAdminPassword);
                    if (createResult.Succeeded)
                    {
                        // Asignar todos los roles excepto Visitante
                        var rolesToAssign = roles.Where(r => r.Name != "Visitante").Select(r => r.Name);
                        await userManager.AddToRolesAsync(superAdminUser, rolesToAssign);
                        Console.WriteLine($"SuperAdmin creado: {superAdminEmail}");
                    }
                    else
                    {
                        Console.WriteLine($"Error al crear SuperAdmin: {string.Join(", ", createResult.Errors)}");
                    }
                }

                // Crear usuario de prueba para cada rol (opcional, solo en desarrollo)
                if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    await CreateTestUsers(userManager);
                }

                // Crear proveedor del sistema para SuperAdmin
                var systemSupplier = await context.Suppliers
                    .FirstOrDefaultAsync(s => s.CompanyName == "Sistema Administrativo");

                if (systemSupplier == null)
                {
                    systemSupplier = new Supplier
                    {
                        CompanyName = "Sistema Administrativo",
                        LegalName = "Administrador del Sistema",
                        Description = "Proveedor predeterminado para productos del sistema",
                        ContactEmail = "admin@sistema.com",
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
                        CommissionRate = 0, // Sin comisión para el sistema
                        OwnerUserId = superAdminUser.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await context.Suppliers.AddAsync(systemSupplier);
                    await context.SaveChangesAsync();
                    Console.WriteLine("Proveedor del sistema creado para SuperAdmin");
                }

                // Verificar y crear SupplierManager para el SuperAdmin si no existe
                var existingSupplierManager = await context.SupplierManagers
                    .FirstOrDefaultAsync(sm => sm.SupplierId == systemSupplier.Id && 
                                              sm.ManagerUserId == superAdminUser.Id);

                if (existingSupplierManager == null)
                {
                    var systemSupplierManager = new SupplierManager
                    {
                        SupplierId = systemSupplier.Id,
                        ManagerUserId = superAdminUser.Id,
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
                        IsActive = true,
                        AssignedByUserId = superAdminUser.Id, // Se auto-asigna
                        AssignedAt = DateTime.UtcNow,
                        Notes = "Gestor automático del sistema para SuperAdmin"
                    };

                    await context.SupplierManagers.AddAsync(systemSupplierManager);
                    await context.SaveChangesAsync();
                    Console.WriteLine("SupplierManager del sistema creado para SuperAdmin");
                }

                // Poblar categorías de prueba si no existen
                if (!await context.Categories.AnyAsync())
                {
                    var categories = new List<Category>
                    {
                        new Category 
                        { 
                            Name = "Electrónicos", 
                            Description = "Dispositivos electrónicos y gadgets de última generación",
                            Slug = "electronicos",
                            DisplayOrder = 1,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category 
                        { 
                            Name = "Ropa y Accesorios", 
                            Description = "Moda para hombre, mujer y niños",
                            Slug = "ropa-accesorios",
                            DisplayOrder = 2,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category 
                        { 
                            Name = "Hogar y Jardín", 
                            Description = "Productos para el hogar y jardinería",
                            Slug = "hogar-jardin",
                            DisplayOrder = 3,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category 
                        { 
                            Name = "Deportes", 
                            Description = "Equipamiento y ropa deportiva",
                            Slug = "deportes",
                            DisplayOrder = 4,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category 
                        { 
                            Name = "Libros y Educación", 
                            Description = "Libros, material educativo y cursos",
                            Slug = "libros-educacion",
                            DisplayOrder = 5,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    await context.Categories.AddRangeAsync(categories);
                    await context.SaveChangesAsync();
                    Console.WriteLine("Categorías de prueba agregadas");
                }

            }
            catch (Exception ex)
            {
                // CORRECCIÓN: Usar un tipo no estático para el logger o usar el nombre de la clase como string
                var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");
                logger.LogError(ex, "Error occurred while seeding database");
                throw;
            }
        }
    }

    private static async Task CreateTestUsers(UserManager<ApplicationUser> userManager)
    {
        // Usuario Proveedor de prueba
        var proveedor = new ApplicationUser
        {
            UserName = "proveedor@tienda.com",
            Email = "proveedor@tienda.com",
            EmailConfirmed = true,
            FirstName = "Juan",
            LastName = "Proveedor",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (await userManager.FindByEmailAsync(proveedor.Email) == null)
        {
            await userManager.CreateAsync(proveedor, "Proveedor@123");
            await userManager.AddToRoleAsync(proveedor, "Proveedor");
            Console.WriteLine("Usuario proveedor de prueba creado");
        }

        // Usuario Gestor de prueba
        var gestor = new ApplicationUser
        {
            UserName = "gestor@tienda.com",
            Email = "gestor@tienda.com",
            EmailConfirmed = true,
            FirstName = "María",
            LastName = "Gestora",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (await userManager.FindByEmailAsync(gestor.Email) == null)
        {
            await userManager.CreateAsync(gestor, "Gestor@123");
            await userManager.AddToRoleAsync(gestor, "Gestor");
            Console.WriteLine("Usuario gestor de prueba creado");
        }

        // Usuario Cliente de prueba
        var cliente = new ApplicationUser
        {
            UserName = "cliente@tienda.com",
            Email = "cliente@tienda.com",
            EmailConfirmed = true,
            FirstName = "Carlos",
            LastName = "Cliente",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (await userManager.FindByEmailAsync(cliente.Email) == null)
        {
            await userManager.CreateAsync(cliente, "Cliente@123");
            await userManager.AddToRoleAsync(cliente, "Cliente");
            Console.WriteLine("Usuario cliente de prueba creado");
        }

        // Usuario con múltiples roles de prueba
        var multiRoleUser = new ApplicationUser
        {
            UserName = "superadmin@superadmin.com",
            Email = "superadmin@superadmin.com",
            EmailConfirmed = true,
            FirstName = "Ana",
            LastName = "Multifuncional",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (await userManager.FindByEmailAsync(multiRoleUser.Email) == null)
        {
            await userManager.CreateAsync(multiRoleUser, "Admin2025*");
            await userManager.AddToRolesAsync(multiRoleUser, new[] { "SuperAdmin" });
            Console.WriteLine("Usuario multi-rol de prueba creado");
        }
    }
}