using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    public class Service
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int SupplierId { get; set; }

        // INFORMACIÓN BÁSICA
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(200)]
        public string? ShortDescription { get; set; }

        // IMÁGENES
        [StringLength(500)]
        public string? Image { get; set; }

        public string? ImageGallery { get; set; } // JSON array de URLs

        // ESPECIFICACIONES DEL SERVICIO (JSON)
        public string? Features { get; set; } // JSON array de características
        public string? Requirements { get; set; } // JSON array de requisitos del cliente
        public string? Deliverables { get; set; } // JSON array de entregables
        public string? Qualifications { get; set; } // JSON array de calificaciones
        public string? Certifications { get; set; } // JSON array de certificaciones

        // DURACIÓN Y DISPONIBILIDAD
        [StringLength(50)]
        public string? Duration { get; set; } // "2 horas", "3 días", "1 semana"

        [StringLength(20)]
        public string? DurationUnit { get; set; } // "hours", "days", "weeks"

        public int? DurationValue { get; set; } // Valor numérico de la duración

        public string? Availability { get; set; } // JSON con horarios disponibles

        // PRECIOS
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CompareAtPrice { get; set; }

        [Required]
        [StringLength(20)]
        public string PricingType { get; set; } = ServicePricingType.Fixed;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? HourlyRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxPrice { get; set; }

        // UBICACIÓN Y ALCANCE
        [Required]
        [StringLength(20)]
        public string ServiceType { get; set; } = ServiceLocationType.Remote;

        [StringLength(500)]
        public string? ServiceArea { get; set; } // Áreas de cobertura

        public string? SupportedLocations { get; set; } // JSON array de ubicaciones

        // CATEGORIZACIÓN
        [StringLength(100)]
        public string? ServiceCategory { get; set; }

        [StringLength(100)]
        public string? ExpertiseArea { get; set; }

        // ESTADO Y VISIBILIDAD
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public bool IsAvailable { get; set; } = true;
        public bool IsVerified { get; set; } = false;

        // SEO
        [StringLength(200)]
        public string? Slug { get; set; }

        [StringLength(200)]
        public string? MetaTitle { get; set; }

        [StringLength(500)]
        public string? MetaDescription { get; set; }

        // MÉTRICAS
        public int ViewCount { get; set; } = 0;
        public int BookingsCount { get; set; } = 0;
        
        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;
        
        public int ReviewCount { get; set; } = 0;

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual ICollection<ServiceCategory> ServiceCategories { get; set; } = new List<ServiceCategory>();
        public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();
        public virtual ICollection<CustomerReview> Reviews { get; set; } = new List<CustomerReview>();
        public virtual ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool HasDiscount => CompareAtPrice.HasValue && CompareAtPrice > Price;

        [NotMapped]
        public decimal DiscountPercentage => HasDiscount ? 
            ((CompareAtPrice!.Value - Price) / CompareAtPrice.Value) * 100 : 0;

        [NotMapped]
        public bool CanBeBooked => IsPublished && IsAvailable && IsVerified;

        [NotMapped]
        public string PriceDisplay => PricingType switch
        {
            ServicePricingType.Fixed => $"{Price:C}",
            ServicePricingType.Hourly => $"{HourlyRate:C}/hora",
            ServicePricingType.Project => $"Desde {MinPrice:C}",
            _ => $"{Price:C}"
        };

        // MÉTODOS HELPER PARA JSON
        [NotMapped]
        public List<string> FeaturesList
        {
            get => string.IsNullOrEmpty(Features) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(Features) ?? new List<string>();
            set => Features = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<string> RequirementsList
        {
            get => string.IsNullOrEmpty(Requirements) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(Requirements) ?? new List<string>();
            set => Requirements = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<string> DeliverablesList
        {
            get => string.IsNullOrEmpty(Deliverables) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(Deliverables) ?? new List<string>();
            set => Deliverables = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<string> ImageGalleryList
        {
            get => string.IsNullOrEmpty(ImageGallery) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(ImageGallery) ?? new List<string>();
            set => ImageGallery = JsonSerializer.Serialize(value);
        }

        // MÉTODOS DE NEGOCIO
        public void Publish()
        {
            IsPublished = true;
            PublishedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Unpublish()
        {
            IsPublished = false;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Verify()
        {
            IsVerified = true;
            VerifiedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateRating(decimal newRating, int newReviewCount)
        {
            Rating = newRating;
            ReviewCount = newReviewCount;
            UpdatedAt = DateTime.UtcNow;
        }

        public bool IsAvailableForDate(DateTime date)
        {
            // Lógica para verificar disponibilidad en una fecha específica
            // Esto podría integrarse con un calendario de disponibilidad
            return IsAvailable && date >= DateTime.UtcNow.Date;
        }
    }

    // CLASES DE CONSTANTES PARA SERVICIOS
    public static class ServicePricingType
    {
        public const string Fixed = "fixed";
        public const string Hourly = "hourly";
        public const string Project = "project";
        public const string Custom = "custom";
    }

    public static class ServiceLocationType
    {
        public const string Remote = "remote";
        public const string Onsite = "onsite";
        public const string Both = "both";
    }
}