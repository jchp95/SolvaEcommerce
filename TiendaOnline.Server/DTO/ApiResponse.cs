/// <summary>
/// Clase para estandarizar las respuestas API
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
     public string? Token { get; init; }

    public ApiResponse(bool success, string message, T data, string? token = null)
    {
        Success = success;
        Message = message;
        Data = data;
        Token = token; 
    }
}
