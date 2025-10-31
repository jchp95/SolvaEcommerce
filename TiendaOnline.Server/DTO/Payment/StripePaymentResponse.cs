namespace TiendaOnline.Server.DTO.Payment
{
    public class StripePaymentResponse
    {
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal FeeAmount { get; set; }
        public decimal NetAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public string? GatewayTransactionId { get; set; }
    }
}
