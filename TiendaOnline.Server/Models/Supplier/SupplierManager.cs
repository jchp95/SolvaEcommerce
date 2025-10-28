using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TiendaOnline.Server.Models
{
    public class SupplierManager
    {
        public int Id { get; set; }

        // FKs EXPLÍCITAS
        [Required]
        public int SupplierId { get; set; }

        [Required]
        public string ManagerUserId { get; set; } = null!;

        // PERMISOS ESPECÍFICOS
        public bool CanManageProducts { get; set; } = true;
        public bool CanManageOrders { get; set; } = true;
        public bool CanManageInventory { get; set; } = true;
        public bool CanManageServices { get; set; } = false; // Para futura implementación
        public bool CanViewReports { get; set; } = true;
        public bool CanManageSettings { get; set; } = false;
        public bool CanManageManagers { get; set; } = false; // Solo para dueño

        // PERMISOS AVANZADOS
        public bool CanEditProductPrices { get; set; } = true;
        public bool CanEditProductStock { get; set; } = true;
        public bool CanPublishProducts { get; set; } = true;
        public bool CanManageDiscounts { get; set; } = false;

        // ESTADO
        public bool IsActive { get; set; } = true;
        
        // FECHAS
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeactivatedAt { get; set; }

        // INFORMACIÓN DE ASIGNACIÓN
        [StringLength(450)]
        public string AssignedByUserId { get; set; } = null!; // Quién asignó este gestor

        [StringLength(500)]
        public string? Notes { get; set; } // Notas sobre la asignación

        // PROPIEDADES DE NAVEGACIÓN
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual ApplicationUser ManagerUser { get; set; } = null!;
        public virtual ApplicationUser AssignedByUser { get; set; } = null!;

        // PROPIEDADES CALCULADAS [NotMapped]
        [NotMapped]
        public string FullPermissionsDescription
        {
            get
            {
                var permissions = new List<string>();
                
                if (CanManageProducts) permissions.Add("Gestionar Productos");
                if (CanManageOrders) permissions.Add("Gestionar Pedidos");
                if (CanManageInventory) permissions.Add("Gestionar Inventario");
                if (CanViewReports) permissions.Add("Ver Reportes");
                if (CanManageSettings) permissions.Add("Gestionar Configuración");
                if (CanManageManagers) permissions.Add("Gestionar Gestores");
                
                return string.Join(", ", permissions);
            }
        }

        [NotMapped]
        public bool IsOwner => ManagerUserId == Supplier.OwnerUserId;

        // MÉTODOS HELPER
        public bool HasPermission(string permission)
        {
            return permission switch
            {
                "manage_products" => CanManageProducts,
                "manage_orders" => CanManageOrders,
                "manage_inventory" => CanManageInventory,
                "view_reports" => CanViewReports,
                "manage_settings" => CanManageSettings,
                "manage_managers" => CanManageManagers,
                "edit_prices" => CanEditProductPrices,
                "edit_stock" => CanEditProductStock,
                "publish_products" => CanPublishProducts,
                "manage_discounts" => CanManageDiscounts,
                _ => false
            };
        }

        public void Deactivate()
        {
            IsActive = false;
            DeactivatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Reactivate()
        {
            IsActive = true;
            DeactivatedAt = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}