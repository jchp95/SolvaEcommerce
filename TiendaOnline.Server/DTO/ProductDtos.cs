using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    // DTO para lectura de productos
    public class ProductReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ShortDescription { get; set; }
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public int Stock { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageFileName { get; set; }
        public string Brand { get; set; } = null!;
        public string? Sku { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Features { get; set; }
        public string? Specs { get; set; }
        public string? Badges { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public bool HasFreeShipping { get; set; }
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public int IdentityId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Propiedades calculadas
        public bool IsInStock => Stock > 0;
        public bool HasDiscount => CompareAtPrice.HasValue && CompareAtPrice > Price;
        public decimal DiscountPercentage => HasDiscount ? 
            ((CompareAtPrice!.Value - Price) / CompareAtPrice.Value) * 100 : 0;

        // Listas de propiedades JSON
        public List<string> FeaturesList => 
            string.IsNullOrEmpty(Features) ? new List<string>() : 
            JsonSerializer.Deserialize<List<string>>(Features) ?? new List<string>();

        public Dictionary<string, string> SpecsDictionary => 
            string.IsNullOrEmpty(Specs) ? new Dictionary<string, string>() : 
            JsonSerializer.Deserialize<Dictionary<string, string>>(Specs) ?? new Dictionary<string, string>();

        public List<string> BadgesList => 
            string.IsNullOrEmpty(Badges) ? new List<string>() : 
            JsonSerializer.Deserialize<List<string>>(Badges) ?? new List<string>();
    }

    // DTO para creación de productos
    public class ProductCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        [StringLength(200)]
        public string? ShortDescription { get; set; }

        [Required]
        [Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Range(0.01, 1000000)]
        public decimal? CompareAtPrice { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = null!;

        [Required]
        public int CategoryId { get; set; }

        public IFormFile? ImageFile { get; set; }
        public string? Sku { get; set; }
        public DateTime? ExpiryDate { get; set; }
        
        // Cambiar a string para recibir JSON serializado desde FormData
        public string? Features { get; set; }
        public string? Specs { get; set; }
        public string? Badges { get; set; }
        
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public bool HasFreeShipping { get; set; } = false;
        public int IdentityId { get; set; }

        // Método para convertir a entidad (actualizado)
        public Product ToEntity(int supplierId)
        {
            return new Product
            {
                Name = Name,
                Description = Description,
                ShortDescription = ShortDescription,
                Price = Price,
                CompareAtPrice = CompareAtPrice,
                Stock = Stock,
                Brand = Brand,
                CategoryId = CategoryId,
                SupplierId = supplierId, 
                Sku = Sku,
                ExpiryDate = ExpiryDate,
                Features = Features, 
                Specs = Specs,       
                Badges = Badges,     
                IsPublished = IsPublished,
                IsFeatured = IsFeatured,
                HasFreeShipping = HasFreeShipping,
                IdentityId = IdentityId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }

    // DTO para actualización de productos
    public class ProductUpdateDto
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        [StringLength(200)]
        public string? ShortDescription { get; set; }

        [Required]
        [Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Range(0.01, 1000000)]
        public decimal? CompareAtPrice { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = null!;

        [Required]
        public int CategoryId { get; set; }

        public IFormFile? ImageFile { get; set; }
        public string? Sku { get; set; }
        public DateTime? ExpiryDate { get; set; }
        
        // Cambiar a string para recibir JSON serializado desde FormData
        public string? Features { get; set; }
        public string? Specs { get; set; }
        public string? Badges { get; set; }
        
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public bool HasFreeShipping { get; set; }
        public int IdentityId { get; set; }

        // Método para convertir a entidad (para actualización)
        public Product ToEntity(int supplierId)
        {
            return new Product
            {
                Id = Id,
                Name = Name,
                Description = Description,
                ShortDescription = ShortDescription,
                Price = Price,
                CompareAtPrice = CompareAtPrice,
                Stock = Stock,
                Brand = Brand,
                CategoryId = CategoryId,
                SupplierId = supplierId,
                Sku = Sku,
                ExpiryDate = ExpiryDate,
                Features = Features, // Ya viene como string JSON
                Specs = Specs,       // Ya viene como string JSON
                Badges = Badges,     // Ya viene como string JSON
                IsPublished = IsPublished,
                IsFeatured = IsFeatured,
                HasFreeShipping = HasFreeShipping,
                IdentityId = IdentityId,
                UpdatedAt = DateTime.UtcNow
                // Nota: ImageUrl e ImageFileName se asignan en el controlador
            };
        }
    }

    // DTO para búsqueda en Meilisearch
    public class SearchProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ShortDescription { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public string Brand { get; set; } = null!;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public int IdentityId { get; set; }
        public string Slug { get; set; } = null!;
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public bool HasFreeShipping { get; set; }
    }
}