using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TiendaOnline.Server.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        // NUEVAS PROPIEDADES
        public string? Image { get; set; }
        
        public string? Icon { get; set; }
        
        // Jerarquía de categorías
        public int? ParentCategoryId { get; set; }
        
        // SEO
        public string? Slug { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        
        // Estado
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        
        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN (MANTENIENDO TU FK)
        [ForeignKey("ParentCategoryId")]
        [JsonIgnore]
        public virtual Category? ParentCategory { get; set; }
        [JsonIgnore]
        public virtual ICollection<Category>? SubCategories { get; set; }
        public virtual ICollection<ProductCategory> ProductCategories { get; set; } = new List<ProductCategory>();
        public virtual ICollection<ServiceCategory> ServiceCategories { get; set; } = new List<ServiceCategory>();
        
        // Relación con productos (ya tienes CategoryId en Product)
        public virtual ICollection<Product>? Products { get; set; }

        // Mantienes tu IdentityId si lo necesitas
        public int IdentityId { get; set; }
    }
}