using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;
using TiendaOnline.Server.Models; // ← AGREGAR este using
using TiendaOnline.Interfaces;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // CORREGIDO: Cambiar IdentityUser por ApplicationUser
    public string GenerateToken(ApplicationUser user, IList<string> roles /* IList<string> permissions*/)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        
        // MEJORADO: Validación más robusta de la clave
        var secretKey = _configuration["Jwt:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new ArgumentException("JWT Secret Key no está configurada");
        }
        
        var key = Encoding.UTF8.GetBytes(secretKey); // ← CAMBIADO a UTF8

        if (user == null)
            throw new ArgumentNullException(nameof(user));
        if (string.IsNullOrWhiteSpace(user.Email))
            throw new ArgumentNullException(nameof(user.Email), "Email no puede ser null");

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id), // ← MEJORADO: Usar estándar JWT
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // ← AGREGADO: ID único del token
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            // AGREGAR claims adicionales del ApplicationUser
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? ""),
            new Claim("isActive", user.IsActive.ToString())
        };

        // MEJORADO: Agregar roles como array y individualmente
        if (roles != null && roles.Count > 0)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            // Agregar todos los roles como un claim separado (útil para el frontend)
            claims.Add(new Claim("roles", string.Join(",", roles)));
        }

        /*
        if (permissions != null && permissions.Count > 0)
        {
            foreach (var permission in permissions.Distinct())
                claims.Add(new Claim("Permission", permission));
            
            // Agregar todos los permisos como un claim separado
            claims.Add(new Claim("permissions", string.Join(",", permissions.Distinct())));
        }
        */

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(1),
            Issuer = _configuration["Jwt:Issuer"], // ← AGREGADO
            Audience = _configuration["Jwt:Audience"], // ← AGREGADO
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}