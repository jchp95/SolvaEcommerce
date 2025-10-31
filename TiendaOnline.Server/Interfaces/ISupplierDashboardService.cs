using System.Threading.Tasks;
using TiendaOnline.Server.DTO.SupplierDto;

namespace TiendaOnline.Server.Interfaces.Supplier
{
    public interface ISupplierDashboardService
    {
        Task<SupplierDashboardDto> GetDashboardAsync(int supplierId);
    }
}

