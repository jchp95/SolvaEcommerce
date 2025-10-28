using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TiendaOnline.Server.Models
{
    public class AddressSnapshot
    {
        // Esta clase se usa para deserializar los snapshots de direcciones en Order
        // NO es una entidad de base de datos, solo DTO para JSON

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

        // PROPIEDADES CALCULADAS
        [JsonIgnore]
        public string FullName => $"{FirstName} {LastName}";

        [JsonIgnore]
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

        // MÉTODOS HELPER
        public static AddressSnapshot FromAddress(Address address)
        {
            return new AddressSnapshot
            {
                FirstName = address.FirstName,
                LastName = address.LastName,
                Street = address.Street,
                Street2 = address.Street2,
                City = address.City,
                State = address.State,
                Country = address.Country,
                PostalCode = address.PostalCode,
                Phone = address.Phone,
                Email = address.Email
            };
        }

        public Address CreateAddress(int customerId, string label = "Snapshot")
        {
            return new Address
            {
                CustomerId = customerId,
                Label = label,
                FirstName = this.FirstName,
                LastName = this.LastName,
                Street = this.Street,
                Street2 = this.Street2,
                City = this.City,
                State = this.State,
                Country = this.Country,
                PostalCode = this.PostalCode,
                Phone = this.Phone,
                Email = this.Email,
                IsDefaultShipping = false,
                IsDefaultBilling = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        public bool IsValidForShipping()
        {
            return !string.IsNullOrEmpty(Street) && 
                   !string.IsNullOrEmpty(City) && 
                   !string.IsNullOrEmpty(Country) && 
                   !string.IsNullOrEmpty(PostalCode);
        }

        public override string ToString()
        {
            return FullAddress;
        }
    }
}