using Microsoft.AspNetCore.Identity;

namespace TiendaOnline.Server.Models
{
    public static class Permissions
    {
        // Permisos para Category
        public static class Category
        {
            public const string Ver = "Permissions.Category.Ver";
            public const string Crear = "Permissions.Category.Crear";
            public const string Editar = "Permissions.Category.Editar";
            public const string Anular = "Permissions.Category.Anular";
        }

        // Permisos para Product
        public static class Product
        {
            public const string Ver = "Permissions.Product.Ver";
            public const string Crear = "Permissions.Product.Crear";
            public const string Editar = "Permissions.Product.Editar";
            public const string Anular = "Permissions.Product.Anular";
        }

        // NUEVOS PERMISOS PARA SUPPLIER
        public static class Supplier
        {
            public const string Ver = "Permissions.Supplier.Ver";
            public const string Crear = "Permissions.Supplier.Crear";
            public const string Editar = "Permissions.Supplier.Editar";
            public const string Anular = "Permissions.Supplier.Anular";
            public const string Verificar = "Permissions.Supplier.Verificar";
        }

        // NUEVOS PERMISOS PARA ORDER
        public static class Order
        {
            public const string Ver = "Permissions.Order.Ver";
            public const string Crear = "Permissions.Order.Crear";
            public const string Editar = "Permissions.Order.Editar";
            public const string Anular = "Permissions.Order.Anular";
            public const string Gestionar = "Permissions.Order.Gestionar";
        }

        public static List<string> GetAllPermissions()
        {
            return typeof(Permissions)
                .GetNestedTypes()
                .SelectMany(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static))
                .Where(f => f.FieldType == typeof(string))
                .Select(f => (string)f.GetValue(null))
                .ToList();
        }

        public static Dictionary<string, List<string>> GetPermissionsByCategory()
        {
            return new Dictionary<string, List<string>>
            {
                ["Category"] = new List<string> { Category.Ver, Category.Crear, Category.Editar, Category.Anular },
                ["Product"] = new List<string> { Product.Ver, Product.Crear, Product.Editar, Product.Anular },
                ["Supplier"] = new List<string> { Supplier.Ver, Supplier.Crear, Supplier.Editar, Supplier.Anular, Supplier.Verificar },
                ["Order"] = new List<string> { Order.Ver, Order.Crear, Order.Editar, Order.Anular, Order.Gestionar }
            };
        }
    }
}