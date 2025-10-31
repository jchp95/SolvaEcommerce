using TiendaOnline.Server.DTO;
using SupplierModel = TiendaOnline.Server.Models.Supplier;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Interfaces
{
    public interface IProveedoresService
    {
        Task<ApiResponse<IEnumerable<SupplierModel>>> GetAllSuppliersAsync();
        Task<ApiResponse<SupplierModel>> GetSupplierByIdAsync(int id);
        Task<ApiResponse<SupplierModel>> GetSupplierByUserIdAsync(string userId);
        Task<ApiResponse<SupplierModel>> CreateSupplierAsync(SupplierModel supplier);
        Task<ApiResponse<SupplierModel>> UpdateSupplierAsync(int id, SupplierModel supplier);
        Task<ApiResponse<int>> DeleteSupplierAsync(int id);
        Task<ApiResponse<bool>> CheckSupplierExistsAsync(string companyName, int? currentId = null);
        Task<ApiResponse<IEnumerable<SupplierModel>>> GetActiveSuppliersAsync();
        Task<ApiResponse<IEnumerable<SupplierModel>>> SearchSuppliersAsync(string searchTerm);
        Task<ApiResponse<SupplierModel>> VerifySupplierAsync(int id);
        Task<ApiResponse<SupplierModel>> SuspendSupplierAsync(int id);
        Task<ApiResponse<SupplierModel>> ActivateSupplierAsync(int id);
        Task<ApiResponse<IEnumerable<Product>>> GetSupplierProductsAsync(int supplierId);
        Task<ApiResponse<IEnumerable<SupplierManager>>> GetSupplierManagersAsync(int supplierId);
        Task<ApiResponse<SupplierManager>> AddManagerToSupplierAsync(int supplierId, SupplierManager manager);
        Task<ApiResponse<bool>> RemoveManagerFromSupplierAsync(int supplierId, string managerUserId);
    }
}