using TiendaOnline.Server.DTO;

namespace TiendaOnline.Server.Services
{
    public interface IAuthService
    {
        Task<string> LoginAsync(string email, string password); 
    }
}
