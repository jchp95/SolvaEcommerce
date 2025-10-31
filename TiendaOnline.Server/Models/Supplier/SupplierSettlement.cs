using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class SupplierSettlement
    {
        public int Id { get; set; }

        [Required]
        public int SupplierId { get; set; }

        [Required]
        public int OrderId { get; set; }

        // Referencia al pago principal de la plataforma (opcional)
        public int? PaymentId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossAmount { get; set; } // total de items del supplier

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CommissionAmount { get; set; } // comisión que retiene la plataforma

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetAmount { get; set; } // amount - commission

        [StringLength(50)]
        public string Status { get; set; } = "pending"; // pending, paid, failed

        [StringLength(100)]
        public string? ReferenceTransactionId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SettlementDate { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navegación
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual Order Order { get; set; } = null!;
        public virtual Payment? Payment { get; set; }
    }
}
