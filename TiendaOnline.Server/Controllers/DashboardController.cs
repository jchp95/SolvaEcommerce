using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TiendaOnline.Server.DTO.SupplierDto;
using TiendaOnline.Server.Interfaces.Supplier;

namespace TiendaOnline.Server.Controllers
{
    [ApiController]
    [Route("api/suppliers/[controller]")]
    [Authorize(Roles = "Supplier,Proveedor,Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ISupplierDashboardService _dashboardService;

        public DashboardController(ISupplierDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("{supplierId}/dashboard")]
        public async Task<ActionResult<SupplierDashboardDto>> GetDashboard(int supplierId)
        {
            // Obtener el userId del usuario autenticado
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var dashboard = await _dashboardService.GetDashboardAsync(supplierId);
            
            if (dashboard == null)
            {
                return NotFound();
            }
            
            return Ok(dashboard);
        }
    }
}
