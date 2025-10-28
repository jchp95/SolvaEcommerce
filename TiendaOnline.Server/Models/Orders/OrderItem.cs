using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class OrderItem
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required] public int OrderId { get; set; }

        [Required] public int SupplierId { get; set; }

        public int? ProductId { get; set; }
        public int? ServiceId { get; set; }

        // INFORMACIÓN DEL ITEM (SNAPSHOT al momento de la compra)
        [Required] [StringLength(100)] public string ItemName { get; set; } = null!;

        [StringLength(500)] public string? ItemImage { get; set; }

        [StringLength(50)] public string? Sku { get; set; }

        // PRECIOS Y CANTIDADES
        [Required] [Range(1, int.MaxValue)] public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        // INFORMACIÓN ADICIONAL DEL PRODUCTO (SNAPSHOT)
        [StringLength(100)] public string? Brand { get; set; }

        [StringLength(20)] public string? Weight { get; set; }

        [StringLength(100)] public string? Dimensions { get; set; }

        // PARA SERVICIOS
        public DateTime? ServiceDate { get; set; }

        [StringLength(500)] public string? ServiceNotes { get; set; }

        // ESTADO DEL ITEM (USANDO AppConstants)
        [Required] [StringLength(20)] public string Status { get; set; } = AppConstants.OrderItemActive;

        [StringLength(1000)] public string? CancelReason { get; set; }

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Order Order { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual Product? Product { get; set; }
        public virtual Service? Service { get; set; }

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped] public decimal PriceBeforeDiscount => UnitPrice + DiscountAmount;

        [NotMapped] public decimal UnitPriceBeforeTax => UnitPrice - TaxAmount;

        [NotMapped] public bool IsCancelled => Status == AppConstants.OrderItemCancelled;

        [NotMapped] public bool CanBeCancelled => Status == AppConstants.OrderItemActive;

        [NotMapped] public decimal LineTotal => UnitPrice * Quantity;

        // MÉTODOS HELPER
        public void Cancel(string reason = "")
        {
            Status = AppConstants.OrderItemCancelled;
            CancelReason = reason;
            CancelledAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateQuantity(int newQuantity)
        {
            if (newQuantity <= 0)
                throw new ArgumentException("La cantidad debe ser mayor a 0");

            Quantity = newQuantity;
            RecalculateTotals();
            UpdatedAt = DateTime.UtcNow;
        }

        public void RecalculateTotals()
        {
            TotalPrice = (UnitPrice * Quantity) - DiscountAmount;
        }

        // MÉTODO PARA CREAR SNAPSHOT DESDE PRODUCTO
        public void CreateSnapshotFromProduct(Product product)
        {
            ItemName = product.Name;
            ItemImage = product.ImageUrl;
            Sku = product.Sku;
            Brand = product.Brand;
            Weight = $"{product.Weight} kg";
            Dimensions = $"{product.Length}x{product.Width}x{product.Height} cm";
            UnitPrice = product.Price;

            // Calcular total inicial
            RecalculateTotals();
        }
    }
}