using Meilisearch;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text;
using TiendaOnline;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models; // ← AGREGAR este using
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using TiendaOnline.Server.Services;
using TiendaOnline.Interfaces;
using TiendaOnline.Server.Interfaces.Categories;
using TiendaOnline.Server.Services.Categories;
using TiendaOnline.Server.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Configuración robusta de Meilisearch
var meilisearchConfig = builder.Configuration.GetSection("Meilisearch");
if (string.IsNullOrEmpty(meilisearchConfig["ServerUrl"]) ||
    string.IsNullOrEmpty(meilisearchConfig["MasterKey"]))
{
    throw new ApplicationException("Meilisearch configuration is missing in appsettings.json");
}

builder.Services.AddSingleton<MeilisearchClient>(sp =>
    new MeilisearchClient(
        meilisearchConfig["ServerUrl"]!,
        meilisearchConfig["MasterKey"]!
    )
);

// ✅ CONFIGURACIÓN CORREGIDA: Usar ApplicationUser y ApplicationRole
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Configuración de Lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // Configuración de contraseña
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;

    // Configuración de User
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.User.RequireUniqueEmail = true;

    // Configuración de SignIn
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ✅ ORDEN CORRECTO: Primero servicios personalizados
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<MeiliProductIndexService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();

// Configurar el tamaño máximo de archivos para uploads
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = int.MaxValue;
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = int.MaxValue;
});

builder.Services.Configure<FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = int.MaxValue;
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Environment.WebRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");

// Configura DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .EnableSensitiveDataLogging()
           .EnableDetailedErrors()
           .LogTo(Console.WriteLine, LogLevel.Information);
});

// Configuración CORS
var corsSettings = builder.Configuration.GetSection("CorsSettings");
var allowOrigins = corsSettings.GetSection("AllowedOrigins").Get<string[]>();

if (allowOrigins == null || allowOrigins.Length == 0)
{
    throw new InvalidOperationException("No se configuraron orígenes permitidos en CorsSettings:AllowedOrigins");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("CustomCorsPolicy", policy =>
    {
        policy.WithOrigins(allowOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();

        Console.WriteLine($"Orígenes CORS permitidos: {string.Join(", ", allowOrigins)}");
    });
});

// ✅ CONFIGURACIÓN DE AUTENTICACIÓN MEJORADA
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];
    if (string.IsNullOrEmpty(jwtSecretKey))
    {
        throw new InvalidOperationException("JWT Secret Key is not configured");
    }

    // ✅ VALIDACIÓN MÁS ROBUSTA
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)), // ← CAMBIADO a UTF8
        ValidateIssuer = true, // ← ACTIVADO
        ValidateAudience = true, // ← ACTIVADO
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = builder.Configuration["Jwt:Issuer"], // ← AGREGADO
        ValidAudience = builder.Configuration["Jwt:Audience"] // ← AGREGADO
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/chathub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"Token validated for user: {context.Principal?.Identity?.Name}");
            return Task.CompletedTask;
        }
    };
});

// ✅ CONFIGURACIÓN DE AUTORIZACIÓN
builder.Services.AddAuthorization(options =>
{
    // Política para SuperAdmin (acceso total)
    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole("SuperAdmin"));

    // Política para gestión de contenido (SuperAdmin + Gestor)
    options.AddPolicy("ManageContent", policy =>
        policy.RequireRole("SuperAdmin", "Gestor"));

    // Política para gestión de productos (SuperAdmin + Proveedor + Gestor)
    options.AddPolicy("ManageProducts", policy =>
        policy.RequireRole("SuperAdmin", "Proveedor", "Gestor"));

    // Política para clientes autenticados
    options.AddPolicy("Authenticated", policy =>
        policy.RequireAuthenticatedUser());

    // Política específica para proveedores
    options.AddPolicy("ProviderOnly", policy =>
        policy.RequireRole("Proveedor"));

    // Política para operaciones de gestión (no incluye Proveedor)
    options.AddPolicy("ManagementTeam", policy =>
        policy.RequireRole("SuperAdmin", "Gestor"));

    // Política para endpoints públicos (visitantes)
    options.AddPolicy("AllowVisitors", policy =>
        policy.RequireAssertion(context =>
            !context.User.Identity?.IsAuthenticated ?? true));

    // Política combinada para usuarios registrados (todos menos visitantes)
    options.AddPolicy("RegisteredUsers", policy =>
        policy.RequireRole("SuperAdmin", "Proveedor", "Gestor", "Cliente"));

    // Política para operaciones de compra
    options.AddPolicy("CanPurchase", policy =>
        policy.RequireRole("Cliente"));

    // Política jerárquica (SuperAdmin > Gestor > Proveedor > Cliente)
    options.AddPolicy("AdminOrHigher", policy =>
        policy.RequireRole("SuperAdmin"));

    options.AddPolicy("ManagerOrHigher", policy =>
        policy.RequireRole("SuperAdmin", "Gestor"));

    options.AddPolicy("ProviderOrHigher", policy =>
        policy.RequireRole("SuperAdmin", "Gestor", "Proveedor"));
});

// Configuración del logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API de Tienda Online",
        Version = "v1",
        Description = "API para la gestión de productos y usuarios",
        Contact = new OpenApiContact
        {
            Name = "Soporte",
            Email = "soporte@tiendaonline.com"
        }
    });

    // Configuración de seguridad JWT para Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Agregar filtro para mostrar los roles requeridos en Swagger
    c.OperationFilter<AuthResponsesOperationFilter>();
});

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads")),
    RequestPath = "/uploads"
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TiendaOnline API v1");
    });
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// ✅ ORDEN CORRECTO DE MIDDLEWARES
app.UseCors("CustomCorsPolicy");
app.UseAuthentication(); // ← PRIMERO Authentication
app.UseAuthorization();  // ← LUEGO Authorization

app.MapControllers();
app.MapFallbackToFile("/index.html");

// Inicialización de la base de datos
await InitializeDatabase(app);

await app.RunAsync();

// ===============================
// MÉTODOS AUXILIARES
// ===============================

async Task InitializeDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Inicializando base de datos...");

        // Ejecutar migraciones
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync();

        // Sembrar datos iniciales
        await SeedData.InitializeAsync(services);

        logger.LogInformation("Base de datos inicializada correctamente.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error al inicializar la base de datos");
    }
}

public class AuthResponsesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var authAttributes = context.MethodInfo
            .GetCustomAttributes(true)
            .OfType<AuthorizeAttribute>()
            .Union(context.MethodInfo.DeclaringType.GetCustomAttributes(true).OfType<AuthorizeAttribute>())
            .ToList();

        if (authAttributes.Any())
        {
            var roles = authAttributes
                .Where(a => !string.IsNullOrEmpty(a.Roles) || !string.IsNullOrEmpty(a.Policy))
                .Select(a => a.Roles ?? a.Policy)
                .ToList();

            operation.Responses.Add("401", new OpenApiResponse { Description = "Unauthorized" });
            operation.Responses.Add("403", new OpenApiResponse { Description = "Forbidden" });

            if (roles.Any())
            {
                operation.Description += $"<p><strong>Roles/Policies requeridos:</strong> {string.Join(", ", roles)}</p>";
            }
        }
    }
}