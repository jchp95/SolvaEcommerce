using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.DTO;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public UsersController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// Obtiene todos los usuarios
        /// </summary>
        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserReadDto>>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new UserReadDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        Email = u.Email,
                        EmailConfirmed = u.EmailConfirmed,
                        PhoneNumber = u.PhoneNumber,
                        PhoneNumberConfirmed = u.PhoneNumberConfirmed,
                        LockoutEnabled = u.LockoutEnabled,
                        TwoFactorEnabled = u.TwoFactorEnabled
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<UserReadDto>>(true, "Usuarios obtenidos con éxito", users));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener usuarios: {ex.Message}", null!));
            }
        }

        /// <summary>
        /// Edita los datos de un usuario
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> PutUser(string id, [FromBody] UserEditDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest(new ApiResponse<string>(false, "ID de usuario no coincide", null!));
            }

            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new ApiResponse<string>(false, $"Usuario con ID {id} no encontrado", null!));
                }

                user.UserName = dto.UserName;
                user.Email = dto.Email;
                user.PhoneNumber = dto.PhoneNumber;
                user.LockoutEnabled = dto.LockoutEnabled;
                user.TwoFactorEnabled = dto.TwoFactorEnabled;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new ApiResponse<object>(false, "Error al actualizar usuario", result.Errors));
                }

                return Ok(new ApiResponse<string>(true, "Usuario actualizado con éxito", null!));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al actualizar usuario: {ex.Message}", null!));
            }
        }
    }
}
