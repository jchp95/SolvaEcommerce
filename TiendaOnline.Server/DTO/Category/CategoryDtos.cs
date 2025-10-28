// CategoryDtos.cs

using System.ComponentModel.DataAnnotations;

public class CategoryCreateDto
{
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Slug { get; set; }

        public int? DisplayOrder { get; set; }

        public int? ParentCategoryId { get; set; }

        [StringLength(60)]
        public string? MetaTitle { get; set; }

        [StringLength(160)]
        public string? MetaDescription { get; set; }

        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }