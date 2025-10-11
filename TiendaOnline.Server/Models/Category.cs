using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Description { get; set; } = null!;

        [Required]
        public int IdentityId { get; set; }
    }
}
