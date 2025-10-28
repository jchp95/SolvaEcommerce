using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Datos personales extendidos
        [StringLength(50)]
        public string FirstName { get; set; } = null!;

        [StringLength(50)]
        public string LastName { get; set; } = null!;

        [StringLength(500)]
        public string? Avatar { get; set; }

        // Estado
        public bool IsActive { get; set; } = true;

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Supplier? Supplier { get; set; }
        public virtual Customer? Customer { get; set; }
        public virtual ICollection<SupplierManager>? ManagedSuppliers { get; set; }
    }
}