using Microsoft.EntityFrameworkCore;
using DotNetApi.Data;
using DotNetApi.Models;

namespace DotNetApi.Services
{
    public class AnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<OrderWithUser>> GetOrdersWithUsersAsync(int limit = 10, int offset = 0)
        {
            var query = from o in _context.Orders
                       join u in _context.Users on o.UserId equals u.Id
                       select new OrderWithUser
                       {
                           OrderId = o.Id,
                           UserId = o.UserId,
                           UserName = u.Name,
                           UserEmail = u.Email,
                           UserCity = u.City,
                           TotalAmount = o.TotalAmount,
                           Status = o.Status,
                           OrderDate = o.OrderDate,
                           ItemCount = o.OrderItems.Count()
                       };

            return await query
                .OrderBy(x => x.OrderId)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<UserOrderSummary>> GetUserOrderSummaryAsync(int limit = 10, int offset = 0)
        {
            var query = from u in _context.Users
                       select new UserOrderSummary
                       {
                           UserId = u.Id,
                           UserName = u.Name,
                           UserEmail = u.Email,
                           TotalOrders = u.Orders.Count(),
                           TotalAmount = u.Orders.Sum(o => o.TotalAmount),
                           AverageOrder = u.Orders.Count() > 0 ? u.Orders.Average(o => o.TotalAmount) : 0,
                           LastOrder = u.Orders.Count() > 0 ? u.Orders.Max(o => o.OrderDate) : DateTime.MinValue
                       };

            return await query
                .OrderByDescending(x => x.TotalAmount)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<object> GetComplexAnalyticsAsync()
        {
            // Get all raw data with explicit joins
            var productData = await _context.Products.ToListAsync();
            var orderItemData = await _context.OrderItems.Include(oi => oi.Order).ThenInclude(o => o.User).ToListAsync();
            
            // Join data in memory to avoid complex LINQ translation
            var joinedData = from p in productData
                           join oi in orderItemData on p.Id equals oi.ProductId
                           select new
                           {
                               Category = p.Category,
                               OrderId = oi.Order.Id,
                               Quantity = oi.Quantity,
                               Price = oi.Price,
                               CustomerAge = oi.Order.User.Age
                           };

            // Group and calculate analytics
            var analytics = joinedData
                .GroupBy(x => x.Category)
                .Select(g => new
                {
                    category = g.Key,
                    total_orders = g.Select(x => x.OrderId).Distinct().Count(),
                    total_quantity = g.Sum(x => x.Quantity),
                    total_revenue = g.Sum(x => x.Price * (decimal)x.Quantity),
                    avg_price = g.Average(x => x.Price * (decimal)x.Quantity),
                    unique_customers = g.Select(x => x.OrderId).Distinct().Count(),
                    avg_customer_age = g.Average(x => x.CustomerAge)
                })
                .ToList();

            return new
            {
                data = analytics,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            };
        }
    }
} 