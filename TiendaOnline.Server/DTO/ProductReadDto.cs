public class ProductReadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int IdentityId { get; set; }
}
