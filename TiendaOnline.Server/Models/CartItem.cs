using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class CartItem
    {
        public int Id { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        // NUEVO: Precio en el momento de agregar al carrito
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        // NUEVO: Snapshot del nombre del producto
        [StringLength(100)]
        public string ProductName { get; set; } = null!;

        // NUEVO: Snapshot de la imagen
        [StringLength(500)]
        public string ProductImage { get; set; } = null!;

        // NUEVO: SKU del producto
        [StringLength(50)]
        public string? ProductSku { get; set; }

        [Required]
        [StringLength(100)]
        public string SessionId { get; set; } = null!; 

        // NUEVO: Para usuarios autenticados
        public string? UserId { get; set; }

        // NUEVO: Fecha de creación
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Product? Product { get; set; }

        // Mantienes tu IdentityId si lo necesitas
        public int IdentityId { get; set; }

        // NUEVO: Propiedad calculada
        [NotMapped]
        public decimal TotalPrice => UnitPrice * Quantity;
    }
}