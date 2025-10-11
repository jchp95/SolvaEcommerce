using System.ComponentModel.DataAnnotations;

public class ProductUpdateDto : ProductCreateDto
{
    [Required]
    public int Id { get; set; }

}
