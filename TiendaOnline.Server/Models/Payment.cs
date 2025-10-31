using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    public class Payment
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int OrderId { get; set; }

        // En el modelo de marketplace (pago único a la plataforma) el Payment puede no estar asociado a un supplier
        public int? SupplierId { get; set; }

        // INFORMACIÓN DEL PAGO
        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = null!; // "stripe", "paypal", "transfer", "cash"

        [Required]
        [StringLength(20)]
        public string PaymentType { get; set; } = PaymentTypeConstants.Sale; // USAR CONSTANTES

        [Required]
        [StringLength(100)]
        public string TransactionId { get; set; } = null!;

        // MONETARIOS
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal FeeAmount { get; set; } // Comisión de la pasarela

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetAmount { get; set; } // Amount - FeeAmount

        // ESTADO
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = AppConstants.PaymentPending;

        [StringLength(500)]
        public string? FailureMessage { get; set; }

        // INFORMACIÓN DE LA PASARELA (JSON)
        public string? GatewayResponse { get; set; }

        [StringLength(100)]
        public string? GatewayTransactionId { get; set; }

        [StringLength(50)]
        public string? Currency { get; set; } = "USD";

        // INFORMACIÓN DE REEMBOLSO
        [StringLength(100)]
        public string? RefundTransactionId { get; set; }

        [StringLength(500)]
        public string? RefundReason { get; set; }

        // FECHAS
        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public DateTime? CapturedDate { get; set; }
        public DateTime? RefundedDate { get; set; }
        public DateTime? FailedDate { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Order Order { get; set; } = null!;
        public virtual Supplier? Supplier { get; set; } = null!;

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsSuccessful => Status == AppConstants.PaymentPaid || 
                                  Status == AppConstants.PaymentAuthorized;

        [NotMapped]
        public bool IsRefunded => Status == AppConstants.PaymentRefunded || 
                                Status == AppConstants.PaymentPartiallyRefunded;

        [NotMapped]
        public bool CanBeRefunded => (Status == AppConstants.PaymentPaid || 
                                    Status == AppConstants.PaymentAuthorized) && 
                                    Amount > 0;

        [NotMapped]
        public decimal RefundableAmount => IsRefunded ? 0 : Amount;

        // MÉTODOS HELPER
        public void MarkAsPaid()
        {
            Status = AppConstants.PaymentPaid;
            CapturedDate = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsAuthorized()
        {
            Status = AppConstants.PaymentAuthorized;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsFailed(string failureMessage = "")
        {
            Status = AppConstants.PaymentFailed;
            FailureMessage = failureMessage;
            FailedDate = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsRefunded(string refundTransactionId = "", string reason = "")
        {
            Status = AppConstants.PaymentRefunded;
            RefundTransactionId = refundTransactionId;
            RefundReason = reason;
            RefundedDate = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsPartiallyRefunded(decimal refundAmount, string refundTransactionId = "", string reason = "")
        {
            Status = AppConstants.PaymentPartiallyRefunded;
            RefundTransactionId = refundTransactionId;
            RefundReason = reason;
            RefundedDate = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SetGatewayResponse(object response)
        {
            GatewayResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                WriteIndented = false
            });
        }

        public T? GetGatewayResponse<T>() where T : class
        {
            return string.IsNullOrEmpty(GatewayResponse) 
                ? null 
                : JsonSerializer.Deserialize<T>(GatewayResponse);
        }

        // MÉTODO PARA CREAR PAGO DE COMISIÓN
        public static Payment CreateCommissionPayment(Order order, Supplier supplier, decimal commissionAmount)
        {
            return new Payment
            {
                OrderId = order.Id,
                SupplierId = supplier.Id,
                PaymentMethod = "platform_commission",
                PaymentType = PaymentTypeConstants.Commission, // USAR CONSTANTE
                TransactionId = $"COMM-{order.OrderNumber}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Amount = commissionAmount,
                FeeAmount = 0,
                NetAmount = commissionAmount,
                Status = AppConstants.PaymentPaid,
                PaymentDate = DateTime.UtcNow,
                CapturedDate = DateTime.UtcNow
            };
        }

        // MÉTODO PARA CREAR PAGO DE REEMBOLSO
        public static Payment CreateRefundPayment(Order order, Supplier supplier, decimal refundAmount, string reason = "")
        {
            return new Payment
            {
                OrderId = order.Id,
                SupplierId = supplier.Id,
                PaymentMethod = order.Payments.FirstOrDefault()?.PaymentMethod ?? "refund",
                PaymentType = PaymentTypeConstants.Refund, // USAR CONSTANTE
                TransactionId = $"REF-{order.OrderNumber}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Amount = refundAmount,
                FeeAmount = 0,
                NetAmount = refundAmount,
                Status = AppConstants.PaymentRefunded,
                PaymentDate = DateTime.UtcNow,
                RefundedDate = DateTime.UtcNow,
                RefundReason = reason
            };
        }
    }

    // CLASE SEPARADA PARA CONSTANTES DE TIPO DE PAGO
    public static class PaymentTypeConstants
    {
        public const string Sale = "sale";
        public const string Refund = "refund";
        public const string Commission = "commission";
    }
}