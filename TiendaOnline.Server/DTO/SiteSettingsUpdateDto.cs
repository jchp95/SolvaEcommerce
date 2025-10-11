using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class SiteSettingsUpdateDto
    {
        [Required]
        [StringLength(100)]
        public string SiteName { get; set; } = string.Empty;

        [StringLength(255)]
        public string? LogoUrl { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(255)]
        public string? QrCodeUrl { get; set; }

        [StringLength(255)]
        public string? Website { get; set; }

        [StringLength(100)]
        public string? FacebookUrl { get; set; }

        [StringLength(100)]
        public string? InstagramUrl { get; set; }

        [StringLength(100)]
        public string? TwitterUrl { get; set; }
    }
}
