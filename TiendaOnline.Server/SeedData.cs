using Microsoft.AspNetCore.Identity;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        // Roles a crear (ordenados por nivel de privilegio)
        string[] roleNames = {
            "SuperAdmin",    // Acceso total, incluye gestión de otros admins
            "Proveedor",     // Puede gestionar sus propios productos y estado de cuenta
            "Gestor",       // Gestión de contenido y operaciones
            "Cliente",       // Usuarios registrados que pueden comprar
            "Visitante"      // Rol base para usuarios no autenticados (se maneja diferente)
        };

        // Crear roles si no existen
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
                Console.WriteLine($"Rol creado: {roleName}");
            }
        }

        // Crear usuario SuperAdmin por defecto (desde configuración)
        var superAdminEmail = configuration["SuperAdmin:Email"] ?? "superadmin@tienda.com";
        var superAdminPassword = configuration["SuperAdmin:Password"] ?? "SuperAdmin@123";

        var superAdmin = new IdentityUser
        {
            UserName = superAdminEmail,
            Email = superAdminEmail,
            EmailConfirmed = true
        };

        var user = await userManager.FindByEmailAsync(superAdminEmail);

        if (user == null)
        {
            var createResult = await userManager.CreateAsync(superAdmin, superAdminPassword);
            if (createResult.Succeeded)
            {
                // Asignar todos los roles excepto Visitante
                await userManager.AddToRolesAsync(superAdmin, roleNames.Where(r => r != "Visitante"));
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

        // Poblar reportes de prueba si no existen
        using (var scope = serviceProvider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TiendaOnline.Server.Context.ApplicationDbContext>();
            if (!db.Reports.Any())
            {
                db.Reports.AddRange(new[]
                {
                    new TiendaOnline.Server.Models.Report
                    {
                        Type = "Ventas",
                        Description = "Ventas totales del mes de septiembre",
                        Date = DateTime.Now.AddDays(-5),
                        Total = 15000.50m
                    },
                    new TiendaOnline.Server.Models.Report
                    {
                        Type = "Usuarios",
                        Description = "Nuevos usuarios registrados en septiembre",
                        Date = DateTime.Now.AddDays(-3),
                        Total = 120
                    },
                    new TiendaOnline.Server.Models.Report
                    {
                        Type = "Productos",
                        Description = "Productos más vendidos en septiembre",
                        Date = DateTime.Now.AddDays(-1),
                        Total = 3200.75m
                    }
                });
                db.SaveChanges();
                Console.WriteLine("Reportes de prueba agregados");
            }
        }
    }

    private static async Task CreateTestUsers(UserManager<IdentityUser> userManager)
    {
        // Usuario Proveedor de prueba
        var proveedor = new IdentityUser
        {
            UserName = "proveedor@tienda.com",
            Email = "proveedor@tienda.com",
            EmailConfirmed = true
        };

        if (await userManager.FindByEmailAsync(proveedor.Email) == null)
        {
            await userManager.CreateAsync(proveedor, "Proveedor@123");
            await userManager.AddToRoleAsync(proveedor, "Proveedor");
            Console.WriteLine("Usuario proveedor de prueba creado");
        }

        // Usuario Gestor de prueba
        var gestor = new IdentityUser
        {
            UserName = "gestor@tienda.com",
            Email = "gestor@tienda.com",
            EmailConfirmed = true
        };

        if (await userManager.FindByEmailAsync(gestor.Email) == null)
        {
            await userManager.CreateAsync(gestor, "Gestor@123");
            await userManager.AddToRoleAsync(gestor, "Gestor");
            Console.WriteLine("Usuario gestor de prueba creado");
        }

        // Usuario Cliente de prueba
        var cliente = new IdentityUser
        {
            UserName = "cliente@tienda.com",
            Email = "cliente@tienda.com",
            EmailConfirmed = true
        };

        if (await userManager.FindByEmailAsync(cliente.Email) == null)
        {
            await userManager.CreateAsync(cliente, "Cliente@123");
            await userManager.AddToRoleAsync(cliente, "Cliente");
            Console.WriteLine("Usuario cliente de prueba creado");
        }
    }
}