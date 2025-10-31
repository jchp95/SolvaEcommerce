
using Microsoft.EntityFrameworkCore;
using TiendaOnline.Server.Context;
using TiendaOnline.Server.DTO.SupplierDto;
using TiendaOnline.Server.Interfaces.Supplier;
using TiendaOnline.Server.Models;

namespace TiendaOnline.Server.Services
{
    public class SupplierDashboardService : ISupplierDashboardService
    {
        private readonly ApplicationDbContext _context;

        public SupplierDashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SupplierDashboardDto> GetDashboardAsync(int supplierId)
        {
            // Productos activos y stock total
            var products = await _context.Products
                .Where(p => p.SupplierId == supplierId && p.IsPublished)
                .ToListAsync();
            var activeProducts = products.Count;
            var totalStock = products.Sum(p => p.Stock);

            // Alertas de bajo stock usando MinStockQuantity
            var lowStockAlerts = products
                .Where(p => p.Stock < p.MinStockQuantity)
                .Select(p => new LowStockAlertDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Stock = p.Stock
                })
                .ToList();

            // Órdenes por estado usando AppConstants
            var orderItems = await _context.OrderItems
                .Where(oi => oi.SupplierId == supplierId)
                .Include(oi => oi.Order)
                .ToListAsync();
            var pendingOrders = orderItems.Count(oi => oi.Order.Status == AppConstants.OrderPending);
            var completedOrders = orderItems.Count(oi => oi.Order.Status == AppConstants.OrderDelivered);
            var cancelledOrders = orderItems.Count(oi => oi.Order.Status == AppConstants.OrderCancelled);

            // Total de ventas
            var totalSales = orderItems.Sum(oi => oi.TotalPrice);

            // Ingresos por mes (últimos 12 meses)
            var now = DateTime.UtcNow;
            var monthlyIncome = orderItems
                .Where(oi => oi.Order.OrderDate > now.AddMonths(-12))
                .GroupBy(oi => new { oi.Order.OrderDate.Year, oi.Order.OrderDate.Month })
                .Select(g => new MonthlyIncomeDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Income = g.Sum(oi => oi.TotalPrice)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToList();

            // Productos más vendidos usando SoldCount
            var topProducts = products
                .OrderByDescending(p => p.SoldCount)
                .Take(5)
                .Select(p => new TopProductDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    QuantitySold = p.SoldCount,
                    TotalSales = orderItems.Where(oi => oi.ProductId == p.Id).Sum(oi => oi.TotalPrice)
                })
                .ToList();

            // Valoración promedio y cantidad de reviews desde Product
            double? averageRating = null;
            if (products.Count > 0)
            {
                averageRating = products.Average(p => (double)p.Rating);
            }

            return new SupplierDashboardDto
            {
                TotalSales = totalSales,
                ActiveProducts = activeProducts,
                TotalStock = totalStock,
                PendingOrders = pendingOrders,
                CompletedOrders = completedOrders,
                CancelledOrders = cancelledOrders,
                MonthlyIncome = monthlyIncome,
                TopProducts = topProducts,
                AverageRating = averageRating,
                LowStockAlerts = lowStockAlerts
            };
        }
    }
}
