using Microsoft.AspNetCore.Mvc;
using DotNetApi.Services;

namespace DotNetApi.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AnalyticsService _analyticsService;

        public AnalyticsController(AnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("orders-with-users")]
        public async Task<IActionResult> GetOrdersWithUsers([FromQuery] int limit = 10, [FromQuery] int offset = 0)
        {
            try
            {
                var orders = await _analyticsService.GetOrdersWithUsersAsync(limit, offset);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("user-order-summary")]
        public async Task<IActionResult> GetUserOrderSummary([FromQuery] int limit = 10, [FromQuery] int offset = 0)
        {
            try
            {
                var summaries = await _analyticsService.GetUserOrderSummaryAsync(limit, offset);
                return Ok(summaries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetComplexAnalytics()
        {
            try
            {
                var analytics = await _analyticsService.GetComplexAnalyticsAsync();
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                service = "dotnet-api"
            });
        }
    }
} 