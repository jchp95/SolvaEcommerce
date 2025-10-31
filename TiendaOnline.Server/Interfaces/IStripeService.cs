namespace TiendaOnline.Server.Interfaces.Payments
{
    using System.Threading.Tasks;
    using Stripe;

    // Interfaz para encapsular la funcionalidad de pagos con Stripe
    public interface IStripeService
    {
        /// <summary>
        /// Procesa un pago en Stripe creando (si es necesario) el cliente y realizando el cargo.
        /// </summary>
        /// <param name="orderId">Id de la orden en nuestro sistema</param>
        /// <param name="supplierId">Id del proveedor asociado</param>
        /// <param name="stripeToken">Token de la tarjeta (source/token) obtenido desde el cliente</param>
        /// <param name="name">Nombre del producto/cliente para la descripción</param>
        /// <param name="amount">Monto en la moneda (ej. 12.34) — el servicio convertirá a céntimos</param>
        /// <param name="email">Email del cliente</param>
        /// <param name="currency">Código de moneda (ej. "usd")</param>
        /// <param name="description">Descripción opcional</param>
        /// <returns>El objeto <see cref="Charge"/> devuelto por Stripe</returns>
        Task<Charge> ProcessPaymentAsync(int orderId, int supplierId, string stripeToken, string name, decimal amount, string email, string currency = "usd", string? description = null);
    }
}
