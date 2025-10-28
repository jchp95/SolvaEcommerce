using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TiendaOnline.Server.Models
{
    public class ServiceBooking
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int ServiceId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        // INFORMACIÓN DE LA RESERVA
        [Required]
        public DateTime BookingDate { get; set; }

        [Required]
        [StringLength(50)]
        public string TimeSlot { get; set; } = null!; // "09:00-11:00", "afternoon", etc.

        public DateTime? EndTime { get; set; }

        // DETALLES ESPECÍFICOS DEL SERVICIO
        public string? CustomerRequirements { get; set; } // JSON con requisitos específicos
        public string? ServiceDetails { get; set; } // JSON con detalles del servicio
        public string? ProviderNotes { get; set; } // Notas internas del proveedor

        // UBICACIÓN (para servicios onsite)
        [StringLength(500)]
        public string? ServiceLocation { get; set; }

        public string? LocationDetails { get; set; } // JSON con detalles de ubicación

        // ESTADO
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = ServiceBookingStatus.Pending;

        [StringLength(1000)]
        public string? StatusNotes { get; set; }

        // CALIFICACIÓN Y REVIEW
        public int? Rating { get; set; } // 1-5

        [StringLength(1000)]
        public string? Review { get; set; }

        public DateTime? ReviewedAt { get; set; }

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        // INFORMACIÓN DE CANCELACIÓN
        [StringLength(50)]
        public string? CancellationReason { get; set; }

        [StringLength(1000)]
        public string? CancellationNotes { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Service Service { get; set; } = null!;
        public virtual Order Order { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsUpcoming => BookingDate > DateTime.UtcNow && 
                                Status == ServiceBookingStatus.Confirmed;

        [NotMapped]
        public bool CanBeCancelled => Status == ServiceBookingStatus.Pending || 
                                    Status == ServiceBookingStatus.Confirmed;

        [NotMapped]
        public bool CanBeRated => Status == ServiceBookingStatus.Completed && 
                                Rating == null && 
                                CompletedAt.HasValue;

        [NotMapped]
        public TimeSpan Duration => EndTime.HasValue ? 
            EndTime.Value - BookingDate : 
            TimeSpan.FromHours(2); // Duración por defecto

        // MÉTODOS HELPER
        public void Confirm()
        {
            Status = ServiceBookingStatus.Confirmed;
            ConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Complete()
        {
            Status = ServiceBookingStatus.Completed;
            CompletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Cancel(string reason = "", string notes = "")
        {
            Status = ServiceBookingStatus.Cancelled;
            CancellationReason = reason;
            CancellationNotes = notes;
            CancelledAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddRating(int rating, string review = "")
        {
            if (rating < 1 || rating > 5)
                throw new ArgumentException("El rating debe estar entre 1 y 5");

            Rating = rating;
            Review = review;
            ReviewedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            // Actualizar rating del servicio
            Service?.UpdateRating(CalculateNewServiceRating(), Service.ReviewCount + 1);
        }

        private decimal CalculateNewServiceRating()
        {
            // Lógica para calcular nuevo rating promedio
            if (Service == null) return Rating ?? 0;
            
            var currentTotal = Service.Rating * Service.ReviewCount;
            var newTotal = currentTotal + (Rating ?? 0);
            return newTotal / (Service.ReviewCount + 1);
        }

        // MÉTODOS PARA JSON
        [NotMapped]
        public Dictionary<string, string> RequirementsDictionary
        {
            get => string.IsNullOrEmpty(CustomerRequirements) 
                ? new Dictionary<string, string>() 
                : JsonSerializer.Deserialize<Dictionary<string, string>>(CustomerRequirements) ?? new Dictionary<string, string>();
            set => CustomerRequirements = JsonSerializer.Serialize(value);
        }
    }

    public static class ServiceBookingStatus
    {
        public const string Pending = "Pending";
        public const string Confirmed = "Confirmed";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
        public const string NoShow = "NoShow";
    }
}