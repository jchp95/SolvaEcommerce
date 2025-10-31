using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO.SupplierDto
{
    public class SupplierCreateDto
    {
        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; } = null!;

        [StringLength(100)]
        public string? LegalName { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? ContactEmail { get; set; }

        [StringLength(20)]
        public string? ContactPhone { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(100)]
        public string? BusinessRegistration { get; set; }

    }

    // En SupplierCreateDto o crear un nuevo DTO para respuesta
    public class SupplierResponseDto
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? Description { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? BusinessRegistration { get; set; }
        public string? Logo { get; set; }
        public string? Banner { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string OwnerUserId { get; set; } = string.Empty;
        
        // Documentos (si los necesitas en la respuesta)
        public string? BusinessLicense { get; set; }
        public string? TaxCertificate { get; set; }
        public string? IdDocument { get; set; }
    }

    public class SupplierUpdateDto
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; } = null!;

        [StringLength(100)]
        public string? LegalName { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Logo { get; set; }
        public string? Banner { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? ContactEmail { get; set; }

        [StringLength(20)]
        public string? ContactPhone { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(100)]
        public string? BusinessRegistration { get; set; }

        [Range(0, 100)]
        public decimal CommissionRate { get; set; }

        [StringLength(50)]
        public string? PaymentMethod { get; set; }

        [StringLength(100)]
        public string? PaymentAccount { get; set; }
    }

    public class SupplierCreatedDto
    {
        public int Id { get; set; }
        public required string CompanyName { get; set; }
        public required string Status { get; set; }
    }
}