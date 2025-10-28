using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Interfaces
{
    public interface ISupplierService
    {
        Task<ApiResponse<IEnumerable<Supplier>>> GetAllSuppliersAsync();
        Task<ApiResponse<Supplier>> GetSupplierByIdAsync(int id);
        Task<ApiResponse<Supplier>> GetSupplierByUserIdAsync(string userId);
        Task<ApiResponse<Supplier>> CreateSupplierAsync(Supplier supplier);
        Task<ApiResponse<Supplier>> UpdateSupplierAsync(int id, Supplier supplier);
        Task<ApiResponse<int>> DeleteSupplierAsync(int id);
        Task<ApiResponse<bool>> CheckSupplierExistsAsync(string companyName, int? currentId = null);
        Task<ApiResponse<IEnumerable<Supplier>>> GetActiveSuppliersAsync();
        Task<ApiResponse<IEnumerable<Supplier>>> SearchSuppliersAsync(string searchTerm);
        Task<ApiResponse<Supplier>> VerifySupplierAsync(int id);
        Task<ApiResponse<Supplier>> SuspendSupplierAsync(int id);
        Task<ApiResponse<Supplier>> ActivateSupplierAsync(int id);
        Task<ApiResponse<IEnumerable<Product>>> GetSupplierProductsAsync(int supplierId);
        Task<ApiResponse<IEnumerable<SupplierManager>>> GetSupplierManagersAsync(int supplierId);
        Task<ApiResponse<SupplierManager>> AddManagerToSupplierAsync(int supplierId, SupplierManager manager);
        Task<ApiResponse<bool>> RemoveManagerFromSupplierAsync(int supplierId, string managerUserId);
    }
}