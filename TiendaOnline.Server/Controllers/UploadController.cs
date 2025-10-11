using Microsoft.AspNetCore.Mvc;
using TiendaOnline.Server.DTO;

namespace TiendaOnline.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<UploadController> _logger;

        public UploadController(IWebHostEnvironment environment, ILogger<UploadController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<ApiResponse<object>>> UploadFile()
        {
            try
            {
                var file = Request.Form.Files.FirstOrDefault();
                var fileType = Request.Form["type"].ToString();

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ApiResponse<string>(false, "No se ha seleccionado ningún archivo", null!));
                }

                // Validar tipo de archivo
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new ApiResponse<string>(false, "Tipo de archivo no permitido", null!));
                }

                // Validar tamaño (5MB máximo)
                if (file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new ApiResponse<string>(false, "El archivo es demasiado grande. Máximo 5MB", null!));
                }

                // Crear directorio si no existe
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", fileType);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generar nombre único para el archivo
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Retornar URL del archivo
                var fileUrl = $"/uploads/{fileType}/{fileName}";
                
                return Ok(new ApiResponse<object>(true, "Archivo subido con éxito", new { url = fileUrl }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir archivo");
                return StatusCode(500, new ApiResponse<string>(false, $"Error al subir archivo: {ex.Message}", null!));
            }
        }

        [HttpDelete("{fileType}/{fileName}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public ActionResult<ApiResponse<string>> DeleteFile(string fileType, string fileName)
        {
            try
            {
                var filePath = Path.Combine(_environment.WebRootPath, "uploads", fileType, fileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new ApiResponse<string>(false, "Archivo no encontrado", null!));
                }

                System.IO.File.Delete(filePath);
                
                return Ok(new ApiResponse<string>(true, "Archivo eliminado con éxito", null!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar archivo");
                return StatusCode(500, new ApiResponse<string>(false, $"Error al eliminar archivo: {ex.Message}", null!));
            }
        }
    }
}
