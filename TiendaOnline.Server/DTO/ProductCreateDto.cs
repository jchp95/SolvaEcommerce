using System.ComponentModel.DataAnnotations;

public class ProductCreateDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = null!;

    [Range(0.01, 1000000)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int IdentityId { get; set; }

    public string? ImageUrl { get; set; }
    public string? ImageFileName { get; set; }
    public IFormFile? ImageFile { get; set; } // Opcional
}