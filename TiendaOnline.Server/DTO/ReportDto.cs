using System;

namespace TiendaOnline.Server.DTO
{
    public class ReportDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Total { get; set; }
    }
}
