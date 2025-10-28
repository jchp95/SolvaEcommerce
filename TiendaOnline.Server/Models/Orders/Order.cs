using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    public class Order
    {
        public int Id { get; set; }

        // IDENTIFICACIÓN ÚNICA
        [Required]
        [StringLength(20)]
        public string OrderNumber { get; set; } = null!;

        // TIPO DE ORDEN
        [Required]
        [StringLength(10)]
        public string OrderType { get; set; } = "product";

        // INFORMACIÓN DEL CLIENTE
        [Required]
        public int CustomerId { get; set; }

        // AGREGAR ESTA PROPIEDAD FALTANTE:
        [Required]
        public string OwnerUserId { get; set; } = null!;

        // SNAPSHOT del cliente al momento del pedido
        [Required]
        [StringLength(100)]
        public string CustomerEmail { get; set; } = null!;

        [StringLength(20)]
        public string CustomerPhone { get; set; } = null!;

        [StringLength(100)]
        public string CustomerFullName { get; set; } = null!;

        // DIRECCIONES - Solo usamos snapshots, sin FK requeridas
        public int? BillingAddressId { get; set; }
        public int? ShippingAddressId { get; set; }

        // SNAPSHOT de direcciones en JSON (requeridos)
        [Required]
        public string BillingAddressSnapshot { get; set; } = null!;
        
        [Required]
        public string ShippingAddressSnapshot { get; set; } = null!;

        // TOTALES
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxTotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingTotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountTotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal OrderTotal { get; set; }

        // INFORMACIÓN DE ENVÍO
        [StringLength(50)]
        public string? ShippingMethod { get; set; }

        [Column(TypeName = "decimal(10,3)")]
        public decimal? ShippingWeight { get; set; }

        [StringLength(100)]
        public string? TrackingNumber { get; set; }

        [StringLength(500)]
        public string? ShippingNotes { get; set; }

        // ESTADOS (USANDO AppConstants)
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = AppConstants.OrderPending;

        [Required]
        [StringLength(20)]
        public string PaymentStatus { get; set; } = AppConstants.PaymentPending;

        [Required]
        [StringLength(20)]
        public string ShippingStatus { get; set; } = AppConstants.ShippingNotShipped;

        // NOTAS
        [StringLength(1000)]
        public string? CustomerNotes { get; set; }

        [StringLength(1000)]
        public string? AdminNotes { get; set; }

        [StringLength(1000)]
        public string? SupplierNotes { get; set; }

        // FECHAS IMPORTANTES
        [Required]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime? PaidDate { get; set; }
        public DateTime? ConfirmedDate { get; set; }
        public DateTime? ProcessingDate { get; set; }
        public DateTime? ShippedDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public DateTime? CancelledDate { get; set; }
        public DateTime? RefundedDate { get; set; }

        // INFORMACIÓN DE CANCELACIÓN/REMBOLSO
        [StringLength(20)]
        public string? CancellationReason { get; set; }

        [StringLength(1000)]
        public string? CancellationNotes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? RefundAmount { get; set; }

        // MÉTRICAS
        public int ItemCount { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Customer Customer { get; set; } = null!;
        public virtual Address BillingAddress { get; set; } = null!;
        public virtual Address ShippingAddress { get; set; } = null!;
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
        
        // AGREGAR ESTA PROPIEDAD DE NAVEGACIÓN FALTANTE:
        public virtual ICollection<CustomerReview> Reviews { get; set; } = new List<CustomerReview>();

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool CanBeCancelled => Status == AppConstants.OrderPending || 
                                    Status == AppConstants.OrderConfirmed || 
                                    Status == AppConstants.OrderProcessing;

        [NotMapped]
        public bool IsFullyPaid => PaymentStatus == AppConstants.PaymentPaid || 
                                 PaymentStatus == AppConstants.PaymentRefunded;

        [NotMapped]
        public bool RequiresShipping => OrderType == "product" && ShippingTotal > 0;

        [NotMapped]
        public TimeSpan TimeSinceOrder => DateTime.UtcNow - OrderDate;

        [NotMapped]
        public decimal PaidAmount => Payments?
            .Where(p => p.Status == AppConstants.PaymentPaid || p.Status == AppConstants.PaymentAuthorized)
            .Sum(p => p.Amount) ?? 0;

        [NotMapped]
        public decimal RemainingAmount => OrderTotal - PaidAmount;

        [NotMapped]
        public bool HasShipping => ShippingTotal > 0;

        // MÉTODOS HELPER MEJORADOS
        public void AddStatusHistory(string newStatus, string notes = "", string changedBy = "")
        {
            StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = Id,
                Status = newStatus,
                Notes = notes,
                CreatedBy = changedBy,
                CreatedAt = DateTime.UtcNow
            });
        }

        public void UpdateStatus(string newStatus, string notes = "", string changedBy = "")
        {
            var oldStatus = Status;
            Status = newStatus;

            // Actualizar fechas específicas según el estado
            switch (newStatus)
            {
                case AppConstants.OrderConfirmed:
                    ConfirmedDate = DateTime.UtcNow;
                    break;
                case AppConstants.OrderProcessing:
                    ProcessingDate = DateTime.UtcNow;
                    break;
                case AppConstants.OrderShipped:
                    ShippedDate = DateTime.UtcNow;
                    ShippingStatus = AppConstants.ShippingShipped;
                    break;
                case AppConstants.OrderDelivered:
                    DeliveredDate = DateTime.UtcNow;
                    ShippingStatus = AppConstants.ShippingDelivered;
                    break;
                case AppConstants.OrderCancelled:
                    CancelledDate = DateTime.UtcNow;
                    break;
                case AppConstants.OrderRefunded:
                    RefundedDate = DateTime.UtcNow;
                    break;
            }

            // Agregar al historial
            AddStatusHistory(newStatus, $"{oldStatus} → {newStatus}. {notes}", changedBy);
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdatePaymentStatus(string newPaymentStatus)
        {
            PaymentStatus = newPaymentStatus;
            
            if (newPaymentStatus == AppConstants.PaymentPaid)
            {
                PaidDate = DateTime.UtcNow;
                // Si el pedido estaba pendiente y se pagó, confirmarlo
                if (Status == AppConstants.OrderPending)
                {
                    UpdateStatus(AppConstants.OrderConfirmed, "Pago confirmado", "System");
                }
            }
            
            UpdatedAt = DateTime.UtcNow;
        }

        // MÉTODOS PARA SNAPSHOTS MEJORADOS (sin dynamic)
        public void SetBillingAddressSnapshot(Address address)
        {
            var snapshot = new AddressSnapshot
            {
                FirstName = address.FirstName,
                LastName = address.LastName,
                Street = address.Street,
                Street2 = address.Street2,
                City = address.City,
                State = address.State,
                Country = address.Country,
                PostalCode = address.PostalCode,
                Phone = address.Phone
            };
            BillingAddressSnapshot = JsonSerializer.Serialize(snapshot);
        }

        public void SetShippingAddressSnapshot(Address address)
        {
            var snapshot = new AddressSnapshot
            {
                FirstName = address.FirstName,
                LastName = address.LastName,
                Street = address.Street,
                Street2 = address.Street2,
                City = address.City,
                State = address.State,
                Country = address.Country,
                PostalCode = address.PostalCode,
                Phone = address.Phone
            };
            ShippingAddressSnapshot = JsonSerializer.Serialize(snapshot);
        }

        public AddressSnapshot? GetBillingAddressSnapshot()
        {
            return string.IsNullOrEmpty(BillingAddressSnapshot) 
                ? null 
                : JsonSerializer.Deserialize<AddressSnapshot>(BillingAddressSnapshot);
        }

        public AddressSnapshot? GetShippingAddressSnapshot()
        {
            return string.IsNullOrEmpty(ShippingAddressSnapshot) 
                ? null 
                : JsonSerializer.Deserialize<AddressSnapshot>(ShippingAddressSnapshot);
        }

        // MÉTODO PARA GENERAR ORDER NUMBER
        public void GenerateOrderNumber()
        {
            var year = DateTime.UtcNow.Year;
            // En la práctica, esto se generaría basado en el último número de orden
            var sequence = Id.ToString("D6"); // Usar ID o buscar último en BD
            OrderNumber = string.Format(AppConstants.OrderNumberFormat, year, sequence);
        }

        // PROPIEDAD DE AUDITORÍA
        public DateTime? UpdatedAt { get; set; }
    }
}