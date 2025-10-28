using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.DTO;
using TiendaOnline.Server.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace TiendaOnline.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetReports()
        {
            try
            {
                var reports = await _context.Reports
                .OrderByDescending(r => r.Date)
                .Select(r => new ReportDto
                {
                    Id = r.Id,
                    Type = r.Type,
                    Description = r.Description,
                    Date = r.Date,
                    Total = r.Total
                })
                .ToListAsync();

                return Ok(new ApiResponse<IEnumerable<ReportDto>>(true, "Reportes obtenidos con éxito", reports));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>(false, $"Error al obtener reportes: {ex.Message}", null!));
            }

        }
    }
}
