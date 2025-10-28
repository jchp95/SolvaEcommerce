namespace TiendaOnline.Server.DTO
{
    public class OrderReadDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = null!;
        public string OrderType { get; set; } = null!;

        // Información del cliente
        public string CustomerEmail { get; set; } = null!;
        public string? CustomerPhone { get; set; }
        public string CustomerFullName { get; set; } = null!;

        // Totales
        public decimal SubTotal { get; set; }
        public decimal TaxTotal { get; set; }
        public decimal ShippingTotal { get; set; }
        public decimal DiscountTotal { get; set; }
        public decimal OrderTotal { get; set; }

        // Estados
        public string Status { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string ShippingStatus { get; set; } = null!;

        // Información de envío
        public string? ShippingMethod { get; set; }
        public string? TrackingNumber { get; set; }

        // Fechas
        public DateTime OrderDate { get; set; }
        public DateTime? ShippingDate { get; set; }
        public DateTime? DeliveryDate { get; set; }

        // Notas
        public string? CustomerNotes { get; set; }
        public string? AdminNotes { get; set; }

        // Items de la orden
        public List<OrderItemReadDto> Items { get; set; } = new List<OrderItemReadDto>();

        // Direcciones
        public AddressReadDto? BillingAddress { get; set; }
        public AddressReadDto? ShippingAddress { get; set; }
    }

    public class OrderItemReadDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? ItemImage { get; set; }
        public string? Sku { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Brand { get; set; }
    }

    public class AddressReadDto
    {
        public string Street { get; set; } = null!;
        public string City { get; set; } = null!;
        public string State { get; set; } = null!;
        public string PostalCode { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string? AdditionalInfo { get; set; }
    }
}
