using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class OrderStatusHistory
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int OrderId { get; set; }

        // INFORMACIÓN DEL CAMBIO
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = null!;

        [StringLength(1000)]
        public string? Notes { get; set; }

        // QUIÉN REALIZÓ EL CAMBIO
        [StringLength(450)]
        public string? CreatedBy { get; set; } // UserId o "System"

        [StringLength(100)]
        public string? CreatedByName { get; set; } // Nombre del usuario o sistema

        // FECHAS
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // INFORMACIÓN ADICIONAL
        [StringLength(50)]
        public string? ActionType { get; set; } // "status_change", "note_added", "automatic"

        public string? AdditionalData { get; set; } // JSON con datos adicionales

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Order Order { get; set; } = null!;

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsSystemAction => CreatedBy == "System" || string.IsNullOrEmpty(CreatedBy);

        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(CreatedByName) ? CreatedByName : "Sistema";

        // MÉTODOS HELPER
        public static OrderStatusHistory CreateSystemHistory(int orderId, string status, string notes = "")
        {
            return new OrderStatusHistory
            {
                OrderId = orderId,
                Status = status,
                Notes = notes,
                CreatedBy = "System",
                CreatedByName = "Sistema Automático",
                ActionType = "automatic",
                CreatedAt = DateTime.UtcNow
            };
        }

        public static OrderStatusHistory CreateUserHistory(int orderId, string status, string userId, string userName, string notes = "")
        {
            return new OrderStatusHistory
            {
                OrderId = orderId,
                Status = status,
                Notes = notes,
                CreatedBy = userId,
                CreatedByName = userName,
                ActionType = "status_change",
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}