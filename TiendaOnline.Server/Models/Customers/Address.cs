using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class Address
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int CustomerId { get; set; }

        // INFORMACIÓN DE LA DIRECCIÓN
        [Required]
        [StringLength(50)]
        public string Label { get; set; } = "Casa"; // Casa, Trabajo, etc.

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string Street { get; set; } = null!;

        [StringLength(200)]
        public string? Street2 { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; } = null!;

        [StringLength(100)]
        public string? State { get; set; }

        [Required]
        [StringLength(100)]
        public string Country { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string PostalCode { get; set; } = null!;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        // TIPOS DE DIRECCIÓN
        public bool IsDefaultShipping { get; set; }
        public bool IsDefaultBilling { get; set; }
        public bool IsActive { get; set; } = true;

        // INFORMACIÓN ADICIONAL
        [StringLength(500)]
        public string? Instructions { get; set; } // Instrucciones de entrega

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Customer Customer { get; set; } = null!;
        public virtual ICollection<Order> BillingOrders { get; set; } = new List<Order>();
        public virtual ICollection<Order> ShippingOrders { get; set; } = new List<Order>();

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";

        [NotMapped]
        public string FullAddress
        {
            get
            {
                var address = Street;
                if (!string.IsNullOrEmpty(Street2))
                    address += $", {Street2}";
                address += $", {City}";
                if (!string.IsNullOrEmpty(State))
                    address += $", {State}";
                address += $", {PostalCode}, {Country}";
                return address;
            }
        }

        [NotMapped]
        public bool CanBeDeleted => !BillingOrders.Any() && !ShippingOrders.Any();

        // MÉTODOS HELPER
        public void SetAsDefaultShipping()
        {
            // Remover default de otras direcciones del mismo cliente
            var otherAddresses = Customer?.Addresses?.Where(a => a.Id != Id);
            if (otherAddresses != null)
            {
                foreach (var address in otherAddresses)
                {
                    address.IsDefaultShipping = false;
                }
            }
            IsDefaultShipping = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SetAsDefaultBilling()
        {
            // Remover default de otras direcciones del mismo cliente
            var otherAddresses = Customer?.Addresses?.Where(a => a.Id != Id);
            if (otherAddresses != null)
            {
                foreach (var address in otherAddresses)
                {
                    address.IsDefaultBilling = false;
                }
            }
            IsDefaultBilling = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            IsDefaultShipping = false;
            IsDefaultBilling = false;
            UpdatedAt = DateTime.UtcNow;
        }

        // MÉTODO PARA VALIDACIÓN
        public bool IsValidForShipping()
        {
            return IsActive && 
                   !string.IsNullOrEmpty(Street) && 
                   !string.IsNullOrEmpty(City) && 
                   !string.IsNullOrEmpty(Country) && 
                   !string.IsNullOrEmpty(PostalCode);
        }
    }
}