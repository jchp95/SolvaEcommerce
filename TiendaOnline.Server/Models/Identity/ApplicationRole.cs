using Microsoft.AspNetCore.Identity;

namespace TiendaOnline.Server.Context;
public class ApplicationRole : IdentityRole
{
    public string Description { get; set; }
    public string RoleType { get; set; } // "System", "Business"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}