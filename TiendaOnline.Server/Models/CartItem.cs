namespace TiendaOnline.Server.Models
{
    // CarritoItem.cs
    public class CartItem
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string SessionId { get; set; } = null!; 
        public int IdentityId { get; set; }
    }
}
