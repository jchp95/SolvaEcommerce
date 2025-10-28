using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class CustomerReview
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int CustomerId { get; set; }

        public int? ProductId { get; set; }
        public int? ServiceId { get; set; }
        public int? OrderId { get; set; }
        public int? ServiceBookingId { get; set; }

        // INFORMACIÓN DE LA RESEÑA
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = null!;

        [Required]
        [StringLength(2000)]
        public string Comment { get; set; } = null!;

        // RESPUESTAS A LA RESEÑA
        [StringLength(2000)]
        public string? SupplierResponse { get; set; }

        public DateTime? SupplierResponseDate { get; set; }

        [StringLength(450)]
        public string? RespondedByUserId { get; set; }

        // MÉTRICAS ADICIONALES
        [Range(1, 5)]
        public int? QualityRating { get; set; }

        [Range(1, 5)]
        public int? ServiceRating { get; set; }

        [Range(1, 5)]
        public int? DeliveryRating { get; set; }

        [Range(1, 5)]
        public int? ValueRating { get; set; }

        // INFORMACIÓN DE VERIFICACIÓN
        public bool IsVerifiedPurchase { get; set; } = false;
        public bool IsEdited { get; set; } = false;

        // MODERACIÓN
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = AppConstants.ReviewStatusPending;

        public bool IsFeatured { get; set; } = false;
        public bool IsRecommended { get; set; } = true;

        [StringLength(1000)]
        public string? RejectionReason { get; set; }

        [StringLength(450)]
        public string? ModeratedByUserId { get; set; }

        public DateTime? ModeratedAt { get; set; }

        // LIKES/DISLIKES
        public int HelpfulVotes { get; set; } = 0;
        public int TotalVotes { get; set; } = 0;

        // FECHAS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime? EditedAt { get; set; }

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Customer Customer { get; set; } = null!;
        public virtual Product? Product { get; set; }
        public virtual Service? Service { get; set; }
        public virtual Order? Order { get; set; }
        public virtual ServiceBooking? ServiceBooking { get; set; }
        public virtual ApplicationUser? RespondedByUser { get; set; }
        public virtual ApplicationUser? ModeratedByUser { get; set; }

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public bool IsApproved => Status == AppConstants.ReviewStatusApproved;

        [NotMapped]
        public bool IsRejected => Status == AppConstants.ReviewStatusRejected;

        [NotMapped]
        public bool IsPending => Status == AppConstants.ReviewStatusPending;

        [NotMapped]
        public decimal HelpfulPercentage => TotalVotes > 0 ? 
            ((decimal)HelpfulVotes / TotalVotes) * 100 : 0; // CORREGIDO: usar decimal

        [NotMapped]
        public bool HasSupplierResponse => !string.IsNullOrEmpty(SupplierResponse);

        [NotMapped]
        public decimal DetailedRatingAverage
        {
            get
            {
                var ratings = new List<int> { Rating };
                if (QualityRating.HasValue) ratings.Add(QualityRating.Value);
                if (ServiceRating.HasValue) ratings.Add(ServiceRating.Value);
                if (DeliveryRating.HasValue) ratings.Add(DeliveryRating.Value);
                if (ValueRating.HasValue) ratings.Add(ValueRating.Value);
                
                return ratings.Count > 0 ? (decimal)ratings.Average() : 0; // CORREGIDO: cast explícito
            }
        }

        [NotMapped]
        public string ReviewType
        {
            get
            {
                if (ProductId.HasValue) return "Product";
                if (ServiceId.HasValue) return "Service";
                if (ServiceBookingId.HasValue) return "ServiceBooking";
                return "General";
            }
        }

        [NotMapped]
        public string ItemName => Product?.Name ?? Service?.Name ?? "Item no disponible";

        [NotMapped]
        public string ItemImage => Product?.ImageUrl ?? Service?.Image ?? string.Empty;

        // MÉTODOS HELPER CORREGIDOS
        public void Approve(string moderatedByUserId = "system")
        {
            Status = AppConstants.ReviewStatusApproved;
            ModeratedByUserId = moderatedByUserId;
            ModeratedAt = DateTime.UtcNow;
            PublishedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            UpdateItemRating();
        }

        public void Reject(string reason, string moderatedByUserId = "system")
        {
            Status = AppConstants.ReviewStatusRejected;
            RejectionReason = reason;
            ModeratedByUserId = moderatedByUserId;
            ModeratedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddSupplierResponse(string response, string respondedByUserId)
        {
            SupplierResponse = response;
            SupplierResponseDate = DateTime.UtcNow;
            RespondedByUserId = respondedByUserId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void EditReview(string newTitle, string newComment, int? newRating = null)
        {
            Title = newTitle;
            Comment = newComment;
            if (newRating.HasValue) Rating = newRating.Value;
            
            IsEdited = true;
            EditedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            if (IsApproved)
            {
                UpdateItemRating();
            }
        }

        public void MarkAsHelpful()
        {
            HelpfulVotes++;
            TotalVotes++;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsNotHelpful()
        {
            TotalVotes++;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkAsVerifiedPurchase()
        {
            IsVerifiedPurchase = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Feature()
        {
            IsFeatured = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Unfeature()
        {
            IsFeatured = false;
            UpdatedAt = DateTime.UtcNow;
        }

        private void UpdateItemRating()
        {
            if (ProductId.HasValue && Product != null)
            {
                var approvedReviews = Product.Reviews?
                    .Where(r => r.Status == AppConstants.ReviewStatusApproved)
                    .ToList();
                    
                if (approvedReviews?.Any() == true)
                {
                    // CORREGIDO: Usar decimal explícitamente
                    Product.Rating = (decimal)approvedReviews.Average(r => r.Rating);
                    Product.ReviewCount = approvedReviews.Count;
                    Product.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (ServiceId.HasValue && Service != null)
            {
                var approvedReviews = Service.Reviews?
                    .Where(r => r.Status == AppConstants.ReviewStatusApproved)
                    .ToList();
                    
                if (approvedReviews?.Any() == true)
                {
                    // CORREGIDO: Usar decimal explícitamente
                    Service.Rating = (decimal)approvedReviews.Average(r => r.Rating);
                    Service.ReviewCount = approvedReviews.Count;
                    Service.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        // MÉTODOS ESTÁTICOS PARA CREAR RESEÑAS
        public static CustomerReview CreateProductReview(int customerId, int productId, int orderId, 
            int rating, string title, string comment, bool isVerifiedPurchase = true)
        {
            return new CustomerReview
            {
                CustomerId = customerId,
                ProductId = productId,
                OrderId = orderId,
                Rating = rating,
                Title = title,
                Comment = comment,
                IsVerifiedPurchase = isVerifiedPurchase,
                Status = AppConstants.ReviewStatusPending,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static CustomerReview CreateServiceReview(int customerId, int serviceId, int serviceBookingId,
            int rating, string title, string comment, int? qualityRating = null, int? serviceRating = null)
        {
            return new CustomerReview
            {
                CustomerId = customerId,
                ServiceId = serviceId,
                ServiceBookingId = serviceBookingId,
                Rating = rating,
                Title = title,
                Comment = comment,
                QualityRating = qualityRating,
                ServiceRating = serviceRating,
                IsVerifiedPurchase = true,
                Status = AppConstants.ReviewStatusPending,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}