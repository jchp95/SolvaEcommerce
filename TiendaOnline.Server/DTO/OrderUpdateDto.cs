using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class OrderUpdateDto
    {
        [Required]
        public string Status { get; set; } = null!;

        [Required] 
        public string ShippingStatus { get; set; } = null!;

        public string? TrackingNumber { get; set; }
        
        public string? AdminNotes { get; set; }
    }
}
