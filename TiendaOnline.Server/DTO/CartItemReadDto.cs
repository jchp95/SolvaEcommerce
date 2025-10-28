namespace TiendaOnline.Server.DTO
{
    public class CartItemReadDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        
        // Usar snapshots del CartItem en lugar de datos del Product
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public string? Sku { get; set; }
        
        // Fechas
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Propiedad calculada
        public decimal TotalPrice { get; set; }
    }
}
