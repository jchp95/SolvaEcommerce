using TiendaOnline.Server.Models;

namespace TiendaOnline.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(ApplicationUser user, IList<string> roles);
    }
}