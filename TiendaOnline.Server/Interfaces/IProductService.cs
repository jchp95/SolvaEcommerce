using TiendaOnline.Server.Models;

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllProductsAsync(bool includeRelations = true);
    Task<IEnumerable<Product>> GetProductsBySupplierAsync(int supplierId, bool includeRelations = true);
    Task<Product?> GetProductByIdAsync(int id, bool includeRelations = true);
    Task<Product> CreateProductAsync(Product product);
    Task<Product?> UpdateProductAsync(int id, Product product);
    Task<bool> DeleteProductAsync(int id);
    Task<bool> ProductExistsAsync(string name, int supplierId, int? excludeId = null);
    Task<bool> CanSupplierPublishProductsAsync(int supplierId);
    Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> GetFeaturedProductsAsync();
    Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
    Task<IEnumerable<Product>> GetLowStockProductsAsync(int supplierId);
    Task UpdateProductRatingAsync(int productId);
}