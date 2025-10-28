using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class Customer
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = null!;

        // Información adicional
        [StringLength(50)]
        public string? Identification { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(20)]
        public string? Gender { get; set; }

        // Preferencias
        [StringLength(10)]
        public string Language { get; set; } = "es";

        [StringLength(10)]
        public string Currency { get; set; } = "USD";

        public bool NewsletterSubscription { get; set; } = true;

        // Métricas
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalSpent { get; set; } = 0;

        public int TotalOrders { get; set; } = 0;

        public DateTime? LastPurchase { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual ApplicationUser? User { get; set; }
        public virtual ICollection<Address>? Addresses { get; set; }
        public virtual ICollection<Order>? Orders { get; set; }
        public virtual ICollection<Wishlist>? Wishlists { get; set; }
        public virtual ICollection<CustomerReview> Reviews { get; set; } = new List<CustomerReview>();
        public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();
    }
}