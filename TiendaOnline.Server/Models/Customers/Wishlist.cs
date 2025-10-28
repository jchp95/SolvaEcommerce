using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class Wishlist
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int CustomerId { get; set; }

        public int? ProductId { get; set; }
        public int? ServiceId { get; set; } // Para futura implementación

        // INFORMACIÓN ADICIONAL
        [StringLength(50)]
        public string? ListName { get; set; } // "Mi lista", "Para navidad", etc.

        public bool IsPublic { get; set; } = false;

        [StringLength(500)]
        public string? Notes { get; set; } // Notas sobre el item en la lista

        // FECHAS
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? RemovedAt { get; set; }

        // PRIORIDAD O ORDEN EN LA LISTA
        public int SortOrder { get; set; } = 0;

        // ESTADO
        public bool IsActive { get; set; } = true;

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Customer Customer { get; set; } = null!;
        public virtual Product? Product { get; set; }
        public virtual Service? Service { get; set; }

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public string ItemName => Product?.Name ?? Service?.Name ?? "Item no disponible";

        [NotMapped]
        public string ItemImage => Product?.ImageUrl ?? Service?.Image ?? string.Empty;

        [NotMapped]
        public decimal? ItemPrice => Product?.Price ?? Service?.Price;

        [NotMapped]
        public bool IsProduct => ProductId.HasValue;

        [NotMapped]
        public bool IsService => ServiceId.HasValue;

        [NotMapped]
        public bool IsAvailable => (Product?.IsPublished == true && Product.Stock > 0) || 
                                 (Service?.IsPublished == true && Service.IsAvailable == true);

        // MÉTODOS HELPER
        public void MoveToPosition(int newPosition)
        {
            SortOrder = newPosition;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RemoveFromWishlist()
        {
            IsActive = false;
            RemovedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RestoreToWishlist()
        {
            IsActive = true;
            RemovedAt = null;
            UpdatedAt = DateTime.UtcNow;
        }

        // MÉTODO PARA CREAR ITEM DE WISHLIST
        public static Wishlist CreateProductWishlist(int customerId, int productId, string listName = "Mi lista")
        {
            return new Wishlist
            {
                CustomerId = customerId,
                ProductId = productId,
                ListName = listName,
                AddedAt = DateTime.UtcNow,
                IsActive = true
            };
        }

        public static Wishlist CreateServiceWishlist(int customerId, int serviceId, string listName = "Mi lista")
        {
            return new Wishlist
            {
                CustomerId = customerId,
                ServiceId = serviceId,
                ListName = listName,
                AddedAt = DateTime.UtcNow,
                IsActive = true
            };
        }
    }
}