using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class ServiceCategory
    {
        // FKs EXPLÍCITAS COMPUESTAS
        public int ServiceId { get; set; }
        public int CategoryId { get; set; }

        public bool IsMainCategory { get; set; } = false;

        // ORDEN EN CATEGORÍAS MÚLTIPLES
        public int DisplayOrder { get; set; } = 0;

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Service Service { get; set; } = null!;
        public virtual Category Category { get; set; } = null!;
    }
}