namespace TiendaOnline.Server.DTO.Payment
{
    // DTO para recibir datos de pago desde el cliente
    public class StripePaymentRequest
    {
        // IDs necesarios para enlazar el pago a la orden y al proveedor
        public int OrderId { get; set; }
        public int SupplierId { get; set; }

        // Token obtenido en el frontend (Stripe.js)
        public string? StripeToken { get; set; }

        // Descripción o nombre del pedido/producto
        public string? Name { get; set; }

        // Monto en unidades decimales (ej. 12.34). Será convertido a céntimos internamente.
        public decimal Amount { get; set; }

        public string? Email { get; set; }
        // Opcional: moneda (por defecto "usd")
        public string Currency { get; set; } = "usd";

        // Información adicional opcional
        public string? Description { get; set; }
    }
}
