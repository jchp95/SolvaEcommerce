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
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;

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

// Agrega Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    // Configuración de Lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // Configuración de contraseña (opcional)
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configurar el tamaño máximo de archivos para uploads
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = int.MaxValue;
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = int.MaxValue; // if don't set default value is: 30 MB
});

builder.Services.Configure<FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = int.MaxValue; // if don't set default value is: 128 MB
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
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

// En Program.cs - versión mejorada y depurada
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

        // Log para depuración
        Console.WriteLine($"Orígenes CORS permitidos: {string.Join(", ", allowOrigins)}");
    });
});

// Configuraci�n de autenticaci�n JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
        ValidateIssuer = false,  // Cambiado a true para validar el emisor
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = false,  // Cambiado a true para validar la audiencia
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero  // Elimina el margen de tiempo para la expiraci�n
    };

    // Opcional: Configuraci�n para usar en desarrollo
    if (builder.Environment.IsDevelopment())
    {
        options.RequireHttpsMetadata = false;
    }
});

// Configuraci�n de Claims
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
            !context.User.Identity.IsAuthenticated));

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

// Configuraci�n del logging
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

    // Configuración de seguridad JWT para Swagger (SÓLO UNA VEZ)
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

app.UseStaticFiles(); // For wwwroot
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Orden correcto de middlewares:
app.UseCors("CustomCorsPolicy");
if (app.Environment.IsDevelopment())
{
    // Permite cualquier origen en desarrollo (solo para pruebas)
    app.UseCors(builder => builder
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());

    // Log adicional
    app.Use(async (context, next) =>
    {
        Console.WriteLine($"Solicitud recibida desde: {context.Request.Headers["Origin"]}");
        await next();
    });
}

app.UseAuthentication();        // 2. Autenticaci�n
app.UseAuthorization();



app.MapControllers();

app.MapFallbackToFile("/index.html");

// Inicializaci�n de la base de datos
await InitializeDatabase(app);

await app.RunAsync();

// ===============================
// M�TODOS AUXILIARES
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
