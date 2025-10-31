// ...existing code...
using Stripe;
using TiendaOnline.Server.Interfaces.Payments;

namespace TiendaOnline.Server.Services
{
    // Servicio que encapsula la lógica de interacción con Stripe.
    public class StripeService : IStripeService
    {
        private readonly ILogger<StripeService> _logger;

        public StripeService(ILogger<StripeService> logger)
        {
            _logger = logger;
        }

        public async Task<Charge> ProcessPaymentAsync(int orderId, int supplierId, string stripeToken, string name, decimal amount, string email, string currency = "usd", string? description = null)
        {
            if (string.IsNullOrEmpty(stripeToken))
                throw new ArgumentException("Stripe token is required", nameof(stripeToken));

            // Convertir a céntimos (stripe espera un entero)
            var amountInCents = Convert.ToInt64(Math.Round(amount * 100m));
            if (amountInCents <= 0)
                throw new ArgumentException("El monto debe ser mayor que 0", nameof(amount));

            try
            {
                var customerService = new CustomerService();
                var chargeService = new ChargeService();

                // Crear cliente en Stripe
                var customer = await customerService.CreateAsync(new CustomerCreateOptions
                {
                    Email = email,
                    Source = stripeToken
                });

                // Crear cargo con metadata para poder rastrear order/supplier
                var chargeOptions = new ChargeCreateOptions
                {
                    Amount = amountInCents,
                    Currency = currency,
                    Description = description ?? $"Compra de {name}",
                    Customer = customer.Id,
                    Metadata = new System.Collections.Generic.Dictionary<string, string>
                    {
                        { "orderId", orderId.ToString() },
                        { "supplierId", supplierId.ToString() }
                    }
                };

                var charge = await chargeService.CreateAsync(chargeOptions);

                _logger.LogInformation("Stripe charge created. ChargeId={ChargeId} Amount={Amount} Currency={Currency}", charge.Id, amountInCents, currency);
                return charge;
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error while processing payment");
                throw; // dejar que el controlador lo maneje (o mapear a error más amigable si se desea)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while processing payment with Stripe");
                throw;
            }
        }
    }
}
