using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class OrderCreateDto
    {
        // Información del cliente
        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = null!;

        [Phone]
        public string? CustomerPhone { get; set; }

        [Required]
        [StringLength(100)]
        public string CustomerFullName { get; set; } = null!;

        // Direcciones
        [Required]
        public AddressCreateDto BillingAddress { get; set; } = null!;

        [Required]
        public AddressCreateDto ShippingAddress { get; set; } = null!;

        // Información de envío
        [StringLength(50)]
        public string? ShippingMethod { get; set; } = "standard";

        // Notas del cliente
        [StringLength(1000)]
        public string? CustomerNotes { get; set; }

        // Información de pago
        [StringLength(20)]
        public string PaymentMethod { get; set; } = "pending";
    }

    public class AddressCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Street { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string City { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string State { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string PostalCode { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Country { get; set; } = null!;

        [StringLength(100)]
        public string? AdditionalInfo { get; set; }
    }
}
