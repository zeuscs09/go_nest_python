namespace DotNetApi.Models
{
    public class UserOrderSummary
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AverageOrder { get; set; }
        public DateTime LastOrder { get; set; }
    }
} 