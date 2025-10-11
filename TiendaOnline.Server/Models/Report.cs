using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class Report
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Type { get; set; } = null!;

        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000)]
        public decimal Total { get; set; }
    }
}
