using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class CartItemCreateDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser al menos 1")]
        public int Quantity { get; set; }
    }
}
