using Microsoft.AspNetCore.Identity;
using TiendaOnline.Server.Context;

namespace TiendaOnline.Server.Models;

public class UserRole : IdentityUserRole<string>
{
    public virtual ApplicationUser? User { get; set; }
    public virtual ApplicationRole? Role { get; set; }
}