using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; } = 0;

        // URL de la imagen (almacenada en cloud storage o servidor)
        [StringLength(500)]
        public string ImageUrl { get; set; } = null!;

        // Nombre del archivo de imagen (opcional, útil para gestión)
        [StringLength(100)]
        public string ImageFileName { get; set; } = null!;

        // Relación con categoría
        [Required]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        // Identificador del propietario/vendedor
        [Required]
        public int IdentityId { get; set; }
    }
}