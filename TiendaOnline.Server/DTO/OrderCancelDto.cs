using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class OrderCancelDto
    {
        [Required]
        [StringLength(500, MinimumLength = 10, ErrorMessage = "La razón de cancelación debe tener entre 10 y 500 caracteres")]
        public string CancellationReason { get; set; } = null!;

        [StringLength(1000)]
        public string? CancellationNotes { get; set; }
    }
}
