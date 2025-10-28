// DTO/LoginRequest.cs
using System.ComponentModel.DataAnnotations;

namespace TiendaOnline.Server.DTO
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "El email es requerido")]
        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        public string Email { get; set; }

        [Required(ErrorMessage = "La contraseña es requerida")]
        public string Password { get; set; }
    }

    public class LoginResponse
    {
        public string Token { get; set; }
        public string Email { get; set; }
        public string Message { get; set; }
    }

}