using System;
using System.Collections.Generic;

namespace TiendaOnline.Server.DTO.SupplierDto
{
    public class SupplierDashboardDto
    {
        public decimal TotalSales { get; set; }
        public int ActiveProducts { get; set; }
        public int TotalStock { get; set; }
        public int PendingOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public List<MonthlyIncomeDto> MonthlyIncome { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public double? AverageRating { get; set; }
        public List<LowStockAlertDto> LowStockAlerts { get; set; } = new();
    }

    public class MonthlyIncomeDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Income { get; set; }
    }

    public class TopProductDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int QuantitySold { get; set; }
        public decimal TotalSales { get; set; }
    }

    public class LowStockAlertDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int Stock { get; set; }
    }
}
