// Services/AuthService.cs
using System.Threading.Tasks;
using Meilisearch;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Interfaces;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.DTO;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthService> _logger;
        private readonly UserManager<ApplicationUser> _userManager; // ← CAMBIADO
        private readonly SignInManager<ApplicationUser> _signInManager; // ← CAMBIADO
        private readonly ITokenService _tokenService;

        public AuthService(
            IConfiguration config,
            ApplicationDbContext context,
            ILogger<AuthService> logger,
            UserManager<ApplicationUser> userManager, // ← CAMBIADO
            SignInManager<ApplicationUser> signInManager, // ← CAMBIADO
            ITokenService tokenService
            )
        {
            _config = config;
            _context = context;
            _logger = logger;
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        public async Task<string> LoginAsync(string email, string password)
        {
            _logger.LogInformation("Iniciando LoginAsync para usuario {email}", email);

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Email inválido para usuario {email}", email);
                throw new UnauthorizedAccessException("Email no registrado");
            }

            // Verificar si el usuario está activo
            if (!user.IsActive)
            {
                _logger.LogWarning("Usuario inactivo: {email}", email);
                throw new UnauthorizedAccessException("Cuenta desactivada");
            }

            var result = await _signInManager.PasswordSignInAsync(
                user,
                password,
                isPersistent: true,
                lockoutOnFailure: true
            );

            if (result.Succeeded)
            {
                var roles = await _userManager.GetRolesAsync(user);

                // ✅ Generar token con roles
                var token = _tokenService.GenerateToken(user, roles);

                _logger.LogInformation("Login exitoso para usuario {email}", email);
                return token;
            }
            else if (result.IsLockedOut)
            {
                _logger.LogWarning("Cuenta bloqueada para usuario {email}", email);
                throw new UnauthorizedAccessException("Cuenta temporalmente bloqueada");
            }
            else if (result.IsNotAllowed)
            {
                _logger.LogWarning("Login no permitido para usuario {email}", email);
                throw new UnauthorizedAccessException("Login no permitido");
            }
            else
            {
                _logger.LogWarning("Credenciales inválidas para usuario {email}", email);
                throw new UnauthorizedAccessException("Credenciales inválidas");
            }
        }
    }
}