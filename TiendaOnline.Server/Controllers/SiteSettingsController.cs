using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;
using TiendaOnline.Server.DTO;
using Microsoft.AspNetCore.Authorization;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SiteSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SiteSettingsReadDto>>> GetSiteSettings()
        {
            try
            {
                var settings = await _context.SiteSettings.FirstOrDefaultAsync();
                
                if (settings == null)
                {
                    // Crear configuración por defecto si no existe
                    settings = new SiteSettings
                    {
                        SiteName = "Ecommerce",
                        Description = "La mejor tienda online",
                        Email = "info@tiendaonline.com",
                        PhoneNumber = "1-800-123-4567",
                        Address = "123 Main St, Ciudad, País"
                    };
                    
                    _context.SiteSettings.Add(settings);
                    await _context.SaveChangesAsync();
                }

                var settingsDto = new SiteSettingsReadDto
                {
                    Id = settings.Id,
                    SiteName = settings.SiteName,
                    LogoUrl = settings.LogoUrl,
                    Description = settings.Description,
                    Address = settings.Address,
                    PhoneNumber = settings.PhoneNumber,
                    Email = settings.Email,
                    QrCodeUrl = settings.QrCodeUrl,
                    Website = settings.Website,
                    FacebookUrl = settings.FacebookUrl,
                    InstagramUrl = settings.InstagramUrl,
                    TwitterUrl = settings.TwitterUrl,
                    CreatedAt = settings.CreatedAt,
                    UpdatedAt = settings.UpdatedAt
                };

                return Ok(new ApiResponse<SiteSettingsReadDto>(true, "Configuración obtenida con éxito", settingsDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener la configuración: {ex.Message}", null!));
            }
        }

        [HttpPut]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<SiteSettingsReadDto>>> UpdateSiteSettings([FromBody] SiteSettingsUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<string>(false, "Datos inválidos", null!));
                }

                var settings = await _context.SiteSettings.FirstOrDefaultAsync();
                
                if (settings == null)
                {
                    return NotFound(new ApiResponse<string>(false, "Configuración no encontrada", null!));
                }

                // Actualizar propiedades
                settings.SiteName = dto.SiteName;
                settings.LogoUrl = dto.LogoUrl;
                settings.Description = dto.Description;
                settings.Address = dto.Address;
                settings.PhoneNumber = dto.PhoneNumber;
                settings.Email = dto.Email;
                settings.QrCodeUrl = dto.QrCodeUrl;
                settings.Website = dto.Website;
                settings.FacebookUrl = dto.FacebookUrl;
                settings.InstagramUrl = dto.InstagramUrl;
                settings.TwitterUrl = dto.TwitterUrl;
                settings.UpdatedAt = DateTime.UtcNow;

                _context.SiteSettings.Update(settings);
                await _context.SaveChangesAsync();

                var settingsDto = new SiteSettingsReadDto
                {
                    Id = settings.Id,
                    SiteName = settings.SiteName,
                    LogoUrl = settings.LogoUrl,
                    Description = settings.Description,
                    Address = settings.Address,
                    PhoneNumber = settings.PhoneNumber,
                    Email = settings.Email,
                    QrCodeUrl = settings.QrCodeUrl,
                    Website = settings.Website,
                    FacebookUrl = settings.FacebookUrl,
                    InstagramUrl = settings.InstagramUrl,
                    TwitterUrl = settings.TwitterUrl,
                    CreatedAt = settings.CreatedAt,
                    UpdatedAt = settings.UpdatedAt
                };

                return Ok(new ApiResponse<SiteSettingsReadDto>(true, "Configuración actualizada con éxito", settingsDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al actualizar la configuración: {ex.Message}", null!));
            }
        }
    }
}
