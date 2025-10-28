namespace TiendaOnline.Server.Models
{
    public static class AppConstants
    {
        // Roles del sistema
        public const string SuperAdminRole = "SuperAdmin";
        public const string AdministratorRole = "Administrator";
        public const string SupplierRole = "Proveedor";  // Actualizado para coincidir con SeedData
        public const string ManagerRole = "Gestor";       // Actualizado para coincidir con SeedData
        public const string CustomerRole = "Cliente";     // Actualizado para coincidir con SeedData
        public const string VisitorRole = "Visitante";    // Agregado para coincidir con SeedData

        // Estados de orden
        public const string OrderPending = "Pending";
        public const string OrderConfirmed = "Confirmed";
        public const string OrderProcessing = "Processing";
        public const string OrderShipped = "Shipped";
        public const string OrderDelivered = "Delivered";
        public const string OrderCancelled = "Cancelled";
        public const string OrderRefunded = "Refunded";

        // Estados de pago
        public const string PaymentPending = "Pending";
        public const string PaymentAuthorized = "Authorized";
        public const string PaymentPaid = "Paid";
        public const string PaymentPartiallyRefunded = "PartiallyRefunded";
        public const string PaymentRefunded = "Refunded";
        public const string PaymentFailed = "Failed";
        public const string PaymentCancelled = "Cancelled";

        // Estados de envío
        public const string ShippingNotShipped = "NotShipped";
        public const string ShippingShipped = "Shipped";
        public const string ShippingDelivered = "Delivered";
        public const string ShippingReturned = "Returned";

        // Estados de proveedor
        public const string SupplierPending = "Pending";
        public const string SupplierActive = "Active";
        public const string SupplierSuspended = "Suspended";
        public const string SupplierRejected = "Rejected";
        public const string SupplierInactive = "Inactive";

        // NUEVAS CONSTANTES PARA ORDER ITEM
        public const string OrderItemActive = "Active";
        public const string OrderItemCancelled = "Cancelled";
        public const string OrderItemRefunded = "Refunded";
        public const string OrderItemShipped = "Shipped";
        public const string OrderItemDelivered = "Delivered";

        // NUEVAS CONSTANTES PARA PAYMENT TYPE (las movemos aquí para centralizar)
        public const string PaymentTypeSale = "sale";
        public const string PaymentTypeRefund = "refund";
        public const string PaymentTypeCommission = "commission";

        // Configuración
        public const decimal DefaultCommissionRate = 15.0m;
        public const int ItemsPerPage = 20;
        
        // Formatos
        public const string OrderNumberFormat = "ORD-{0}-{1:D6}";
        
        // NUEVAS CONSTANTES PARA SERVICIOS
        public const string ServicePricingFixed = "fixed";
        public const string ServicePricingHourly = "hourly";
        public const string ServicePricingProject = "project";
        public const string ServicePricingCustom = "custom";

        public const string ServiceLocationRemote = "remote";
        public const string ServiceLocationOnsite = "onsite";
        public const string ServiceLocationBoth = "both";

        // ESTADOS DE RESERVA DE SERVICIOS
        public const string ServiceBookingPending = "Pending";
        public const string ServiceBookingConfirmed = "Confirmed";
        public const string ServiceBookingInProgress = "InProgress";
        public const string ServiceBookingCompleted = "Completed";
        public const string ServiceBookingCancelled = "Cancelled";
        public const string ServiceBookingNoShow = "NoShow";
        
        // NUEVAS CONSTANTES PARA REVIEWS
        public const string ReviewStatusPending = "Pending";
        public const string ReviewStatusApproved = "Approved";
        public const string ReviewStatusRejected = "Rejected";
        public const string ReviewStatusFlagged = "Flagged";
        public const string ReviewStatusArchived = "Archived";

        // LÍMITES PARA REVIEWS
        public const int MinReviewTitleLength = 5;
        public const int MaxReviewTitleLength = 200;
        public const int MinReviewCommentLength = 10;
        public const int MaxReviewCommentLength = 2000;
        public const int MinReviewRating = 1;
        public const int MaxReviewRating = 5;
        
        // NUEVAS CONSTANTES PARA INVENTORY
        public const string InventoryMovementSale = "Sale";
        public const string InventoryMovementPurchase = "Purchase";
        public const string InventoryMovementAdjustment = "Adjustment";
        public const string InventoryMovementReturn = "Return";
        public const string InventoryMovementTransfer = "Transfer";
        public const string InventoryMovementDamage = "Damage";
        public const string InventoryMovementProduction = "Production";
    }
}