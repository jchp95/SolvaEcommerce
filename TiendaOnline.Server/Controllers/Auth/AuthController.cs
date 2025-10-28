using Microsoft.AspNetCore.Mvc;
using TiendaOnline.Server.DTO;
using TiendaOnline.Server.Services;
using System.Reflection;

namespace TiendaOnline.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request) // ← CAMBIADO el tipo de retorno
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<string>(false, "Datos inválidos", null));
                }

                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new ApiResponse<string>(false, "Email y contraseña son requeridos", null));
                }

                var token = await _authService.LoginAsync(request.Email, request.Password);
                
                // Crear respuesta con token
                var response = new LoginResponse
                {
                    Token = token,
                    Email = request.Email,
                    Message = "Login exitoso"
                };

                return Ok(new ApiResponse<LoginResponse>(true, "Login exitoso", response));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Credenciales inválidas para {Email}", request.Email);
                return Unauthorized(new ApiResponse<string>(false, ex.Message, null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción inesperada en Login para {Email}", request.Email);
                return StatusCode(500, new ApiResponse<string>(false, "Error interno del servidor", null));
            }
        }
    }
}