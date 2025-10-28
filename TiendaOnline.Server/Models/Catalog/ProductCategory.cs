namespace TiendaOnline.Server.Models;
public class ProductCategory
{
    public int ProductId { get; set; }
    public int CategoryId { get; set; }
    public bool IsMainCategory { get; set; }
    
    public virtual Product Product { get; set; }
    public virtual Category Category { get; set; }
}
