using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Context
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {
        // Identity & Users (ya incluidos en IdentityDbContext)

        // Suppliers
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<SupplierManager> SupplierManagers { get; set; }

        // Customers
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Address> Addresses { get; set; }

        // Catalog
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductCategory> ProductCategories { get; set; }
        public DbSet<Service> Services { get; set; } // Cambiado de 'Services' a 'Service'
        public DbSet<ServiceCategory> ServiceCategories { get; set; }

        // Orders & Payments
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

        // Shopping
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }

        // Services
        public DbSet<ServiceBooking> ServiceBookings { get; set; }

        // Reviews & Ratings
        public DbSet<CustomerReview> CustomerReviews { get; set; }

        // Inventory
        public DbSet<InventoryHistory> InventoryHistories { get; set; }

        // Reports & Settings
        public DbSet<Report> Reports { get; set; }
        public DbSet<SiteSettings> SiteSettings { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========================
            // CONFIGURACIÓN DE IDENTITY
            // ========================
            
            // Configurar Identity personalizado
            modelBuilder.Entity<ApplicationUser>(entity =>
            {
                // Relación uno a uno con Supplier
                entity.HasOne(u => u.Supplier)
                    .WithOne(s => s.OwnerUser)
                    .HasForeignKey<Supplier>(s => s.OwnerUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relación uno a uno con Customer
                entity.HasOne(u => u.Customer)
                    .WithOne(c => c.User)
                    .HasForeignKey<Customer>(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // CONFIGURACIÓN DE SUPPLIERS
            // ========================

            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasIndex(s => s.OwnerUserId).IsUnique();
                entity.HasIndex(s => s.Status);

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<SupplierManager>(s => s.Managers)
                    .WithOne(sm => sm.Supplier)
                    .HasForeignKey(sm => sm.SupplierId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<Product>(s => s.Products)
                    .WithOne(p => p.Supplier)
                    .HasForeignKey(p => p.SupplierId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<Service>(s => s.Services)
                    .WithOne(svc => svc.Supplier)
                    .HasForeignKey(svc => svc.SupplierId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<OrderItem>(s => s.OrderItems)
                    .WithOne(oi => oi.Supplier)
                    .HasForeignKey(oi => oi.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany<Payment>(s => s.Payments)
                    .WithOne(p => p.Supplier)
                    .HasForeignKey(p => p.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany<InventoryHistory>(s => s.InventoryHistories)
                    .WithOne(ih => ih.Supplier)
                    .HasForeignKey(ih => ih.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<SupplierManager>(entity =>
            {
                entity.HasIndex(sm => new { sm.SupplierId, sm.ManagerUserId }).IsUnique();

                entity.HasOne(sm => sm.Supplier)
                    .WithMany(s => s.Managers)
                    .HasForeignKey(sm => sm.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(sm => sm.ManagerUser)
                    .WithMany(u => u.ManagedSuppliers)
                    .HasForeignKey(sm => sm.ManagerUserId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(sm => sm.AssignedByUser)
                    .WithMany()
                    .HasForeignKey(sm => sm.AssignedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // CONFIGURACIÓN DE CUSTOMERS
            // ========================

            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasIndex(c => c.UserId).IsUnique();

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<Address>(c => c.Addresses)
                    .WithOne(a => a.Customer)
                    .HasForeignKey(a => a.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<Order>(c => c.Orders)
                    .WithOne(o => o.Customer)
                    .HasForeignKey(o => o.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany<Wishlist>(c => c.Wishlists)
                    .WithOne(w => w.Customer)
                    .HasForeignKey(w => w.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<CustomerReview>(c => c.Reviews)
                    .WithOne(cr => cr.Customer)
                    .HasForeignKey(cr => cr.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<ServiceBooking>(c => c.ServiceBookings)
                    .WithOne(sb => sb.Customer)
                    .HasForeignKey(sb => sb.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Address>(entity =>
            {
                entity.HasIndex(a => a.CustomerId);
                entity.HasIndex(a => new { a.CustomerId, a.IsDefaultShipping });
                entity.HasIndex(a => new { a.CustomerId, a.IsDefaultBilling });

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<Order>(a => a.BillingOrders)
                    .WithOne(o => o.BillingAddress)
                    .HasForeignKey(o => o.BillingAddressId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany<Order>(a => a.ShippingOrders)
                    .WithOne(o => o.ShippingAddress)
                    .HasForeignKey(o => o.ShippingAddressId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // CONFIGURACIÓN DE CATALOG
            // ========================

            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(c => c.Slug).IsUnique();
                entity.HasIndex(c => c.ParentCategoryId);
                entity.HasIndex(c => c.IsActive);

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<Category>(c => c.SubCategories)
                    .WithOne(c => c.ParentCategory)
                    .HasForeignKey(c => c.ParentCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasIndex(p => p.Slug).IsUnique();
                entity.HasIndex(p => p.SupplierId);
                entity.HasIndex(p => p.CategoryId);
                entity.HasIndex(p => p.Sku).IsUnique();
                entity.HasIndex(p => p.IsPublished);

                // RELACIÓN CON CATEGORY - CORREGIDA
                entity.HasOne(p => p.Category)
                    .WithMany()
                    .HasForeignKey(p => p.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict); // ← AGREGADO

                // RELACIÓN CON SUPPLIER - CORREGIDA  
                entity.HasOne(p => p.Supplier)
                    .WithMany(s => s.Products)
                    .HasForeignKey(p => p.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict); // ← AGREGADO

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<OrderItem>(p => p.OrderItems)
                    .WithOne(oi => oi.Product)
                    .HasForeignKey(oi => oi.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← YA ESTABA CORRECTO

                entity.HasMany<InventoryHistory>(p => p.InventoryHistories)
                    .WithOne(ih => ih.Product)
                    .HasForeignKey(ih => ih.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasMany<CustomerReview>(p => p.Reviews)
                    .WithOne(cr => cr.Product)
                    .HasForeignKey(cr => cr.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasMany<Wishlist>(p => p.Wishlists)
                    .WithOne(w => w.Product)
                    .HasForeignKey(w => w.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                // Configurar propiedades JSON
                entity.Property(p => p.Features)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );

                entity.Property(p => p.Specs)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );

                entity.Property(p => p.Badges)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );

                entity.Property(p => p.ImageGallery)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );
            });

            // Tablas intermedias para categorías
            modelBuilder.Entity<ProductCategory>()
                .HasKey(pc => new { pc.ProductId, pc.CategoryId });

            modelBuilder.Entity<ProductCategory>()
                .HasOne(pc => pc.Product)
                .WithMany(p => p.ProductCategories)
                .HasForeignKey(pc => pc.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductCategory>()
                .HasOne(pc => pc.Category)
                .WithMany(c => c.ProductCategories)
                .HasForeignKey(pc => pc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ServiceCategory>()
                .HasKey(sc => new { sc.ServiceId, sc.CategoryId });

            modelBuilder.Entity<ServiceCategory>()
                .HasOne(sc => sc.Service)
                .WithMany(s => s.ServiceCategories)
                .HasForeignKey(sc => sc.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ServiceCategory>()
                .HasOne(sc => sc.Category)
                .WithMany(c => c.ServiceCategories)
                .HasForeignKey(sc => sc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // ========================
            // CONFIGURACIÓN DE ORDERS
            // ========================

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(o => o.OrderNumber).IsUnique();
                entity.HasIndex(o => o.CustomerId);
                entity.HasIndex(o => o.OrderDate);
                entity.HasIndex(o => o.Status);
                entity.HasIndex(o => o.PaymentStatus);

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<OrderItem>(o => o.OrderItems)
                    .WithOne(oi => oi.Order)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<Payment>(o => o.Payments)
                    .WithOne(p => p.Order)
                    .HasForeignKey(p => p.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<OrderStatusHistory>(o => o.StatusHistory)
                    .WithOne(osh => osh.Order)
                    .HasForeignKey(osh => osh.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<CustomerReview>(o => o.Reviews)
                    .WithOne(cr => cr.Order)
                    .HasForeignKey(cr => cr.OrderId)
                    .OnDelete(DeleteBehavior.SetNull);

                // CORREGIDO: Relación con Customer usando CustomerId
                entity.HasOne(o => o.Customer)
                    .WithMany(c => c.Orders)
                    .HasForeignKey(o => o.CustomerId) // ← Usar CustomerId (int)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configurar OwnerUserId como FK opcional para ApplicationUser
                entity.HasOne<ApplicationUser>()
                    .WithMany()
                    .HasForeignKey(o => o.OwnerUserId)
                    .IsRequired(false) // Hacerla opcional si no siempre se usa
                    .OnDelete(DeleteBehavior.Restrict);

                // Configurar propiedades JSON para snapshots
                entity.Property(o => o.BillingAddressSnapshot)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );

                entity.Property(o => o.ShippingAddressSnapshot)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasIndex(oi => oi.OrderId);
                entity.HasIndex(oi => oi.SupplierId);
                entity.HasIndex(oi => oi.ProductId);

                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(oi => oi.Supplier)
                    .WithMany(s => s.OrderItems)
                    .HasForeignKey(oi => oi.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(oi => oi.Product)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(oi => oi.ProductId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<OrderStatusHistory>(entity =>
            {
                entity.HasIndex(osh => osh.OrderId);
                entity.HasIndex(osh => osh.CreatedAt);

                entity.HasOne(osh => osh.Order)
                    .WithMany(o => o.StatusHistory)
                    .HasForeignKey(osh => osh.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // CONFIGURACIÓN DE PAYMENTS
            // ========================

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasIndex(p => p.OrderId);
                entity.HasIndex(p => p.SupplierId);
                entity.HasIndex(p => p.TransactionId).IsUnique();
                entity.HasIndex(p => p.GatewayTransactionId);

                entity.HasOne(p => p.Order)
                    .WithMany(o => o.Payments)
                    .HasForeignKey(p => p.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Supplier)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(p => p.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // CONFIGURACIÓN DE SHOPPING
            // ========================

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasIndex(ci => ci.SessionId);
                entity.HasIndex(ci => ci.UserId);
                entity.HasIndex(ci => ci.ProductId);

                entity.HasOne(ci => ci.Product)
                    .WithMany()
                    .HasForeignKey(ci => ci.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Wishlist>(entity =>
            {
                entity.HasIndex(w => w.CustomerId);
                entity.HasIndex(w => w.ProductId);
                entity.HasIndex(w => w.ServiceId);
                entity.HasIndex(w => new { w.CustomerId, w.IsActive });

                entity.HasOne(w => w.Customer)
                    .WithMany(c => c.Wishlists)
                    .HasForeignKey(w => w.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(w => w.Product)
                    .WithMany(p => p.Wishlists)
                    .HasForeignKey(w => w.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(w => w.Service)
                    .WithMany(s => s.Wishlists)
                    .HasForeignKey(w => w.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict
            });

            // ========================
            // CONFIGURACIÓN DE SERVICES
            // ========================

            modelBuilder.Entity<Service>(entity =>
            {
                entity.HasIndex(s => s.SupplierId);
                entity.HasIndex(s => s.Slug).IsUnique();
                entity.HasIndex(s => s.IsPublished);
                entity.HasIndex(s => s.IsFeatured);

                // CORREGIDO: Especificar tipos explícitamente
                entity.HasMany<ServiceBooking>(s => s.ServiceBookings)
                    .WithOne(sb => sb.Service)
                    .HasForeignKey(sb => sb.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany<CustomerReview>(s => s.Reviews)
                    .WithOne(cr => cr.Service)
                    .HasForeignKey(cr => cr.ServiceId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany<Wishlist>(s => s.Wishlists)
                    .WithOne(w => w.Service)
                    .HasForeignKey(w => w.ServiceId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configurar propiedades JSON
                entity.Property(s => s.Features)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );

                entity.Property(s => s.Availability)
                    .HasConversion(
                        v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                        v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<string>(v, (System.Text.Json.JsonSerializerOptions)null)
                    );
            });

            modelBuilder.Entity<ServiceBooking>(entity =>
            {
                entity.HasIndex(sb => sb.ServiceId);
                entity.HasIndex(sb => sb.OrderId);
                entity.HasIndex(sb => sb.CustomerId);
                entity.HasIndex(sb => sb.BookingDate);
                entity.HasIndex(sb => sb.Status);

                entity.HasOne(sb => sb.Service)
                    .WithMany(s => s.ServiceBookings)
                    .HasForeignKey(sb => sb.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sb => sb.Order)
                    .WithMany() // Un Order puede tener un ServiceBooking
                    .HasForeignKey(sb => sb.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sb => sb.Customer)
                    .WithMany(c => c.ServiceBookings)
                    .HasForeignKey(sb => sb.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // CONFIGURACIÓN DE REVIEWS
            // ========================

            modelBuilder.Entity<CustomerReview>(entity =>
            {
                entity.HasIndex(cr => cr.CustomerId);
                entity.HasIndex(cr => cr.ProductId);
                entity.HasIndex(cr => cr.ServiceId);
                entity.HasIndex(cr => cr.OrderId);
                entity.HasIndex(cr => cr.Status);
                entity.HasIndex(cr => cr.CreatedAt);
                entity.HasIndex(cr => cr.Rating);
                entity.HasIndex(cr => cr.IsFeatured);
                entity.HasIndex(cr => cr.IsVerifiedPurchase);

                // Restricción: Solo una review por producto/servicio por cliente
                entity.HasIndex(cr => new { cr.CustomerId, cr.ProductId })
                    .HasFilter("[ProductId] IS NOT NULL")
                    .IsUnique();

                entity.HasIndex(cr => new { cr.CustomerId, cr.ServiceId })
                    .HasFilter("[ServiceId] IS NOT NULL")
                    .IsUnique();

                entity.HasIndex(cr => new { cr.CustomerId, cr.ServiceBookingId })
                    .HasFilter("[ServiceBookingId] IS NOT NULL")
                    .IsUnique();

                // Relaciones
                entity.HasOne(cr => cr.Customer)
                    .WithMany(c => c.Reviews)
                    .HasForeignKey(cr => cr.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(cr => cr.Product)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(cr => cr.ProductId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(cr => cr.Service)
                    .WithMany(s => s.Reviews)
                    .HasForeignKey(cr => cr.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de Cascade a Restrict

                entity.HasOne(cr => cr.Order)
                    .WithMany(o => o.Reviews)
                    .HasForeignKey(cr => cr.OrderId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de SetNull a Restrict

                entity.HasOne(cr => cr.ServiceBooking)
                    .WithMany()
                    .HasForeignKey(cr => cr.ServiceBookingId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de SetNull a Restrict

                entity.HasOne(cr => cr.RespondedByUser)
                    .WithMany()
                    .HasForeignKey(cr => cr.RespondedByUserId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de SetNull a Restrict

                entity.HasOne(cr => cr.ModeratedByUser)
                    .WithMany()
                    .HasForeignKey(cr => cr.ModeratedByUserId)
                    .OnDelete(DeleteBehavior.Restrict); // ← CAMBIADO de SetNull a Restrict
            });

            // ========================
            // CONFIGURACIÓN DE INVENTORY
            // ========================

            modelBuilder.Entity<InventoryHistory>(entity =>
            {
                entity.HasIndex(ih => ih.ProductId);
                entity.HasIndex(ih => ih.SupplierId);
                entity.HasIndex(ih => ih.OrderId);
                entity.HasIndex(ih => ih.MovementType);
                entity.HasIndex(ih => ih.CreatedAt);
                entity.HasIndex(ih => ih.BatchNumber);

                entity.HasOne(ih => ih.Product)
                    .WithMany(p => p.InventoryHistories)
                    .HasForeignKey(ih => ih.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ih => ih.Supplier)
                    .WithMany(s => s.InventoryHistories)
                    .HasForeignKey(ih => ih.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ih => ih.Order)
                    .WithMany()
                    .HasForeignKey(ih => ih.OrderId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(ih => ih.AdjustedByUser)
                    .WithMany()
                    .HasForeignKey(ih => ih.AdjustedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ========================
            // CONFIGURACIÓN DE REPORTS & SETTINGS
            // ========================

            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasIndex(r => r.Type);
                entity.HasIndex(r => r.Date);
            });

        }
    }
}