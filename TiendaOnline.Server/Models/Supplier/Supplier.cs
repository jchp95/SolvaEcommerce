using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class Supplier
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; } = null!;

        [StringLength(100)]
        public string? LegalName { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        // Imágenes
        [StringLength(500)]
        public string? Logo { get; set; }

        [StringLength(500)]
        public string? Banner { get; set; }

        // Información de contacto
        [EmailAddress]
        [StringLength(100)]
        public string? ContactEmail { get; set; }

        [StringLength(20)]
        public string? ContactPhone { get; set; }

        // Dirección
        [StringLength(255)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        // Información legal
        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(100)]
        public string? BusinessRegistration { get; set; }

        // Documentos (AGREGAR ESTAS PROPIEDADES)
        [StringLength(500)]
        public string? BusinessLicense { get; set; }

        [StringLength(500)]
        public string? TaxCertificate { get; set; }

        [StringLength(500)]
        public string? IdDocument { get; set; }

        // Estado y verificación (USANDO AppConstants)
        [StringLength(20)]
        public string Status { get; set; } = AppConstants.SupplierPending;
        
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }

        // Configuración comercial
        [Column(TypeName = "decimal(5,2)")]
        public decimal CommissionRate { get; set; } = AppConstants.DefaultCommissionRate;

        [StringLength(50)]
        public string? PaymentMethod { get; set; }

        [StringLength(100)]
        public string? PaymentAccount { get; set; }

        // Métricas
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalSales { get; set; } = 0;

        public int TotalOrders { get; set; } = 0;

        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;

        public int ReviewCount { get; set; } = 0;

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // RELACIONES
        [Required]
        public string OwnerUserId { get; set; } = null!;

        // Propiedades de navegación
        public virtual ApplicationUser? OwnerUser { get; set; }
        public virtual ICollection<Product>? Products { get; set; }
        public virtual ICollection<SupplierManager>? Managers { get; set; }
        public virtual ICollection<Order>? Orders { get; set; }
        public virtual ICollection<Service> Services { get; set; } = new List<Service>();
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<InventoryHistory> InventoryHistories { get; set; } = new List<InventoryHistory>();

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsActive => Status == AppConstants.SupplierActive;
        
        [NotMapped]
        public bool CanSell => IsActive && IsVerified;

        // MÉTODOS HELPER
        public void Activate()
        {
            Status = AppConstants.SupplierActive;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Suspend()
        {
            Status = AppConstants.SupplierSuspended;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Verify()
        {
            IsVerified = true;
            VerifiedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}