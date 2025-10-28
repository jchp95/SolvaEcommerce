using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            // Validar que el proveedor existe y está activo
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.Id == product.SupplierId && 
                                        s.Status == AppConstants.SupplierActive && 
                                        s.IsVerified);

            if (supplier == null)
            {
                throw new ArgumentException("El proveedor no existe o no está activo/verificado");
            }

            // Validar que no exista el mismo producto para el mismo proveedor
            var existingProduct = await _context.Products
                .AnyAsync(p => p.Name.ToLower() == product.Name.ToLower().Trim() && 
                              p.SupplierId == product.SupplierId);

            if (existingProduct)
            {
                throw new ArgumentException("Ya existe un producto con este nombre para este proveedor");
            }

            // Validar categorías si se proporcionan
            if (product.ProductCategories?.Any() == true)
            {
                var categoryIds = product.ProductCategories.Select(pc => pc.CategoryId).ToList();
                var validCategories = await _context.Categories
                    .Where(c => categoryIds.Contains(c.Id) && c.IsActive)
                    .CountAsync();

                if (validCategories != categoryIds.Count)
                {
                    throw new ArgumentException("Una o más categorías no existen o están inactivas");
                }
            }

            // Validar SKU único por proveedor si se proporciona
            if (!string.IsNullOrEmpty(product.Sku))
            {
                var skuExists = await _context.Products
                    .AnyAsync(p => p.Sku == product.Sku && p.SupplierId == product.SupplierId);

                if (skuExists)
                {
                    throw new ArgumentException("Ya existe un producto con este SKU para este proveedor");
                }
            }

            // Asignar valores por defecto
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            // Si el proveedor no está verificado, el producto no puede estar publicado
            if (!supplier.IsVerified || supplier.Status != AppConstants.SupplierActive)
            {
                product.IsPublished = false;
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return product;
        }

        public async Task<Product?> UpdateProductAsync(int id, Product product)
        {
            var existingProduct = await _context.Products
                .Include(p => p.ProductCategories)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existingProduct == null) return null;

            // Usar el proveedor del producto existente (no permitir cambio de proveedor)
            var supplierId = existingProduct.SupplierId;

            // Validar que el proveedor existe (relajar validación para SuperAdmin)
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.Id == supplierId);

            if (supplier == null)
            {
                throw new ArgumentException("El proveedor del producto no existe");
            }

            // Validar nombre único (mismo nombre + mismo proveedor) excluyendo el producto actual
            var nameExists = await _context.Products
                .AnyAsync(p => p.Name.ToLower() == product.Name.ToLower().Trim() && 
                              p.SupplierId == supplierId && 
                              p.Id != id);

            if (nameExists)
            {
                throw new ArgumentException("Ya existe otro producto con este nombre para este proveedor");
            }

            // Validar SKU único por proveedor excluyendo el producto actual
            if (!string.IsNullOrEmpty(product.Sku) && product.Sku != existingProduct.Sku)
            {
                var skuExists = await _context.Products
                    .AnyAsync(p => p.Sku == product.Sku && 
                                  p.SupplierId == supplierId && 
                                  p.Id != id);

                if (skuExists)
                {
                    throw new ArgumentException("Ya existe otro producto con este SKU para este proveedor");
                }
            }

            // Actualizar propiedades básicas
            existingProduct.Name = product.Name;
            existingProduct.Description = product.Description;
            existingProduct.ShortDescription = product.ShortDescription;
            existingProduct.Price = product.Price;
            existingProduct.CompareAtPrice = product.CompareAtPrice;
            // NO actualizar Cost si no se proporciona - preservar el existente
            if (product.Cost > 0) 
            {
                existingProduct.Cost = product.Cost;
            }
            existingProduct.Stock = product.Stock;
            // Preservar valores existentes para campos no incluidos en DTO
            // existingProduct.MinStockQuantity - no actualizar, mantener existente
            // existingProduct.TrackInventory - no actualizar, mantener existente  
            // existingProduct.AllowBackorder - no actualizar, mantener existente
            existingProduct.ImageUrl = product.ImageUrl;
            existingProduct.ImageFileName = product.ImageFileName;
            existingProduct.Brand = product.Brand;
            existingProduct.Sku = product.Sku;
            // Preservar Gtin si no se actualiza en DTO
            // existingProduct.Gtin - no actualizar, mantener existente
            existingProduct.ExpiryDate = product.ExpiryDate;
            // Preservar AvailableDate si no se actualiza en DTO  
            // existingProduct.AvailableDate - no actualizar, mantener existente
            existingProduct.Features = product.Features;
            existingProduct.Specs = product.Specs;
            existingProduct.Badges = product.Badges;
            // Preservar campos SEO si no se actualizan en DTO
            // existingProduct.Slug - no actualizar, mantener existente
            // existingProduct.MetaTitle - no actualizar, mantener existente
            // existingProduct.MetaDescription - no actualizar, mantener existente
            // NO actualizar SupplierId - se mantiene el original
            existingProduct.CategoryId = product.CategoryId;
            existingProduct.UpdatedAt = DateTime.UtcNow;

            // Para proveedores normales: Si no están verificados, el producto no puede estar publicado
            // Para SuperAdmin (proveedor "Sistema Administrativo"): permitir cualquier estado
            if (supplier.CompanyName == "Sistema Administrativo")
            {
                // SuperAdmin puede publicar libremente
                existingProduct.IsPublished = product.IsPublished;
            }
            else if (!supplier.IsVerified || supplier.Status != AppConstants.SupplierActive)
            {
                existingProduct.IsPublished = false;
            }
            else
            {
                existingProduct.IsPublished = product.IsPublished;
            }

            existingProduct.IsFeatured = product.IsFeatured;
            existingProduct.HasFreeShipping = product.HasFreeShipping;

            // Actualizar categorías si se proporcionan
            if (product.ProductCategories?.Any() == true)
            {
                // Eliminar categorías existentes
                _context.ProductCategories.RemoveRange(existingProduct.ProductCategories);

                // Agregar nuevas categorías
                foreach (var pc in product.ProductCategories)
                {
                    existingProduct.ProductCategories.Add(new ProductCategory
                    {
                        ProductId = existingProduct.Id,
                        CategoryId = pc.CategoryId,
                        IsMainCategory = pc.IsMainCategory
                    });
                }
            }

            await _context.SaveChangesAsync();
            
            return existingProduct;
        }

        public async Task<bool> ProductExistsAsync(string name, int supplierId, int? excludeId = null)
        {
            var query = _context.Products
                .Where(p => p.Name.ToLower() == name.ToLower() && p.SupplierId == supplierId);

            if (excludeId.HasValue)
            {
                query = query.Where(p => p.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> CanSupplierPublishProductsAsync(int supplierId)
        {
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.Id == supplierId);

            return supplier != null && 
                   supplier.IsVerified && 
                   supplier.Status == AppConstants.SupplierActive;
        }

        // Mantener los demás métodos sin cambios...
        public async Task<IEnumerable<Product>> GetAllProductsAsync(bool includeRelations = true)
        {
            var query = _context.Products.AsQueryable();

            if (includeRelations)
            {
                query = query
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Include(p => p.ProductCategories)
                        .ThenInclude(pc => pc.Category)
                    .Include(p => p.Reviews)
                    .Include(p => p.InventoryHistories)
                    .Include(p => p.Wishlists);
            }

            // SuperAdmin debe ver todos los productos (publicados y borradores) para gestión
            // Solo filtrar por IsPublished en métodos públicos como GetProductsByCategoryAsync()
            return await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetProductsBySupplierAsync(int supplierId, bool includeRelations = true)
        {
            var query = _context.Products.Where(p => p.SupplierId == supplierId);

            if (includeRelations)
            {
                query = query
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Include(p => p.ProductCategories)
                        .ThenInclude(pc => pc.Category)
                    .Include(p => p.Reviews)
                    .Include(p => p.InventoryHistories)
                    .Include(p => p.Wishlists);
            }

            // Para productos del proveedor actual, mostrar todos (publicados y no publicados)
            return await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id, bool includeRelations = true)
        {
            var query = _context.Products.AsQueryable();

            if (includeRelations)
            {
                query = query
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Include(p => p.ProductCategories)
                        .ThenInclude(pc => pc.Category)
                    .Include(p => p.Reviews)
                        .ThenInclude(r => r.Customer)
                    .Include(p => p.InventoryHistories)
                    .Include(p => p.Wishlists)
                    .Include(p => p.OrderItems);
            }

            // Para gestión (dashboard), permitir acceso a productos publicados y borradores
            // El filtro IsPublished debe aplicarse en nivel de controlador según el contexto
            return await query
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.ProductCategories)
                .Include(p => p.OrderItems)
                .Include(p => p.Reviews)
                .Include(p => p.InventoryHistories)
                .Include(p => p.Wishlists)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return false;

            // Verificar si hay órdenes asociadas
            if (product.OrderItems.Any())
            {
                throw new InvalidOperationException("No se puede eliminar el producto porque tiene órdenes asociadas");
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Include(p => p.Reviews)
                .Where(p => p.IsPublished && 
                           (p.CategoryId == categoryId || 
                            p.ProductCategories.Any(pc => pc.CategoryId == categoryId)))
                .OrderByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetFeaturedProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Include(p => p.Reviews)
                .Where(p => p.IsPublished && p.IsFeatured)
                .OrderByDescending(p => p.Rating)
                .ThenByDescending(p => p.CreatedAt)
                .Take(12)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Enumerable.Empty<Product>();

            var term = searchTerm.ToLower().Trim();

            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Include(p => p.Reviews)
                .Where(p => p.IsPublished && 
                           (p.Name.ToLower().Contains(term) ||
                            (p.Brand != null && p.Brand.ToLower().Contains(term)) ||
                            (p.Sku != null && p.Sku.ToLower().Contains(term)) ||
                            (p.Category != null && p.Category.Name.ToLower().Contains(term))))
                .OrderByDescending(p => p.Name.ToLower().Contains(term))
                .ThenByDescending(p => p.Rating)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync(int supplierId)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.SupplierId == supplierId && 
                           p.TrackInventory && 
                           p.Stock <= p.MinStockQuantity && 
                           p.Stock > 0)
                .OrderBy(p => p.Stock)
                .ToListAsync();
        }

        public async Task UpdateProductRatingAsync(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product != null)
            {
                var approvedReviews = product.Reviews
                    .Where(r => r.Status == AppConstants.ReviewStatusApproved)
                    .ToList();

                if (approvedReviews.Any())
                {
                    product.Rating = (decimal)approvedReviews.Average(r => r.Rating);
                    product.ReviewCount = approvedReviews.Count;
                    product.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}