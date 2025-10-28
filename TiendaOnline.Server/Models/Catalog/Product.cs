using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string Description { get; set; } = null!;

        [StringLength(200)]
        public string? ShortDescription { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CompareAtPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Cost { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; } = 0;

        public int MinStockQuantity { get; set; } = 5;
        public bool TrackInventory { get; set; } = true;
        public bool AllowBackorder { get; set; } = false;

        // Imágenes
        [StringLength(500)]
        public string ImageUrl { get; set; } = null!;

        [StringLength(100)]
        public string ImageFileName { get; set; } = null!;

        // PROPIEDADES JSON (se almacenan como string en BD)
        public string? ImageGallery { get; set; } // JSON array de URLs

        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = null!;

        // SKU y códigos
        [StringLength(50)]
        public string? Sku { get; set; }

        [StringLength(100)]
        public string? Gtin { get; set; }

        // Fechas
        public DateTime? ExpiryDate { get; set; }
        public DateTime? AvailableDate { get; set; }

        // PROPIEDADES JSON para datos complejos
        public string? Features { get; set; }  // JSON array
        public string? Specs { get; set; }     // JSON object
        public string? Badges { get; set; }    // JSON array

        // SEO
        public string? Slug { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }

        // Estado
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public bool HasFreeShipping { get; set; } = false;

        // Dimensiones
        [Column(TypeName = "decimal(10,3)")]
        public decimal Weight { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Length { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Width { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Height { get; set; }

        // Métricas
        public int ViewCount { get; set; } = 0;
        public int SoldCount { get; set; } = 0;
        
        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;
        
        public int ReviewCount { get; set; } = 0;

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }

        // Relaciones
        [Required]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public int IdentityId { get; set; }

        // PROPIEDADES DE NAVEGACIÓN (AGREGAR Reviews)
        public virtual Category? Category { get; set; }
        public virtual ICollection<ProductCategory> ProductCategories { get; set; } = new List<ProductCategory>();
        public virtual Supplier? Supplier { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<InventoryHistory> InventoryHistories { get; set; } = new List<InventoryHistory>();
        public virtual ICollection<CustomerReview> Reviews { get; set; } = new List<CustomerReview>(); // ✅ AGREGAR ESTA LÍNEA
        public virtual ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsInStock => Stock > 0;
        
        [NotMapped]
        public bool IsLowStock => TrackInventory && Stock <= MinStockQuantity && Stock > 0;
        
        [NotMapped]
        public bool HasDiscount => CompareAtPrice.HasValue && CompareAtPrice > Price;
        
        [NotMapped]
        public decimal DiscountPercentage => HasDiscount ? 
            ((CompareAtPrice!.Value - Price) / CompareAtPrice.Value) * 100 : 0;
    }
}