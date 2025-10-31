using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class InventoryHistory
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int ProductId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public int? OrderId { get; set; }
        public int? PurchaseOrderId { get; set; } // Para compras de inventario
        
        // CORREGIDO: Cambiar de int? a string
        public string? AdjustedByUserId { get; set; } // Quién realizó el ajuste

        // INFORMACIÓN DEL MOVIMIENTO
        [Required]
        public int QuantityChange { get; set; } // Positivo = entrada, Negativo = salida

        [Required]
        public int StockAfterChange { get; set; } // Stock después del movimiento

        [Required]
        [StringLength(20)]
        public string MovementType { get; set; } = AppConstants.InventoryMovementSale; // Usar AppConstants

        // INFORMACIÓN ADICIONAL
        [StringLength(500)]
        public string Notes { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? UnitCost { get; set; } // Costo unitario (para compras)

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalCost { get; set; } // Costo total (para compras)

        [StringLength(100)]
        public string? ReferenceNumber { get; set; } // Número de referencia externo

        [StringLength(100)]
        public string? BatchNumber { get; set; } // Número de lote (para productos perecederos)

        public DateTime? ExpiryDate { get; set; } // Fecha de vencimiento del lote

        // UBICACIÓN EN ALMACÉN
        [StringLength(50)]
        public string? Location { get; set; } // Ubicación en el almacén

        [StringLength(50)]
        public string? Shelf { get; set; } // Estante/anaquel

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Product Product { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual Order? Order { get; set; }
        public virtual ApplicationUser? AdjustedByUser { get; set; }

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsIncoming => QuantityChange > 0;

        [NotMapped]
        public bool IsOutgoing => QuantityChange < 0;

        [NotMapped]
        public int AbsoluteQuantityChange => Math.Abs(QuantityChange);

        [NotMapped]
        public string MovementDescription => MovementType switch
        {
            AppConstants.InventoryMovementSale => "Venta",
            AppConstants.InventoryMovementPurchase => "Compra",
            AppConstants.InventoryMovementAdjustment => "Ajuste",
            AppConstants.InventoryMovementReturn => "Devolución",
            AppConstants.InventoryMovementTransfer => "Transferencia",
            AppConstants.InventoryMovementDamage => "Daño/Pérdida",
            AppConstants.InventoryMovementProduction => "Producción",
            _ => "Movimiento"
        };

        [NotMapped]
        public string DirectionSymbol => IsIncoming ? "↑" : "↓";

        [NotMapped]
        public string DirectionText => IsIncoming ? "Entrada" : "Salida";

        // MÉTODOS HELPER CORREGIDOS
        public static InventoryHistory CreateSaleMovement(int productId, int supplierId, int orderId, 
            int quantity, int currentStock, string notes = "")
        {
            return new InventoryHistory
            {
                ProductId = productId,
                SupplierId = supplierId,
                OrderId = orderId,
                QuantityChange = -quantity, // Negativo para ventas
                StockAfterChange = currentStock - quantity,
                MovementType = AppConstants.InventoryMovementSale,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static InventoryHistory CreatePurchaseMovement(int productId, int supplierId, 
            int quantity, int currentStock, decimal unitCost, string batchNumber = "", 
            DateTime? expiryDate = null, string notes = "")
        {
            return new InventoryHistory
            {
                ProductId = productId,
                SupplierId = supplierId,
                QuantityChange = quantity, // Positivo para compras
                StockAfterChange = currentStock + quantity,
                MovementType = AppConstants.InventoryMovementPurchase,
                UnitCost = unitCost,
                TotalCost = unitCost * quantity,
                BatchNumber = batchNumber,
                ExpiryDate = expiryDate,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static InventoryHistory CreateAdjustmentMovement(int productId, int supplierId, 
            int quantityChange, int currentStock, string adjustedByUserId, string notes = "")
        {
            return new InventoryHistory
            {
                ProductId = productId,
                SupplierId = supplierId,
                QuantityChange = quantityChange,
                StockAfterChange = currentStock + quantityChange,
                MovementType = AppConstants.InventoryMovementAdjustment,
                AdjustedByUserId = adjustedByUserId,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static InventoryHistory CreateReturnMovement(int productId, int supplierId, int orderId,
            int quantity, int currentStock, string notes = "")
        {
            return new InventoryHistory
            {
                ProductId = productId,
                SupplierId = supplierId,
                OrderId = orderId,
                QuantityChange = quantity, // Positivo para devoluciones
                StockAfterChange = currentStock + quantity,
                MovementType = AppConstants.InventoryMovementReturn,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        // MÉTODO PARA VALIDAR MOVIMIENTO
        public bool IsValidMovement()
        {
            // Validar que el stock después del cambio no sea negativo
            if (StockAfterChange < 0)
                return false;

            // Validar tipos de movimiento
            var validMovementTypes = new[] 
            { 
                AppConstants.InventoryMovementSale, 
                AppConstants.InventoryMovementPurchase, 
                AppConstants.InventoryMovementAdjustment, 
                AppConstants.InventoryMovementReturn, 
                AppConstants.InventoryMovementTransfer, 
                AppConstants.InventoryMovementDamage, 
                AppConstants.InventoryMovementProduction 
            };

            return validMovementTypes.Contains(MovementType);
        }

        // MÉTODO PARA OBTENER DETALLES DEL MOVIMIENTO
        public string GetMovementDetails()
        {
            var details = $"{MovementDescription} - {AbsoluteQuantityChange} unidades";

            if (!string.IsNullOrEmpty(ReferenceNumber))
                details += $" (Ref: {ReferenceNumber})";

            if (!string.IsNullOrEmpty(Notes))
                details += $" - {Notes}";

            return details;
        }
    }

    // ELIMINAMOS la clase InventoryMovementType y usamos AppConstants
}