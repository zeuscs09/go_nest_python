using Microsoft.EntityFrameworkCore;
using DotNetApi.Data;
using DotNetApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext - use in-memory database for testing
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Use in-memory database for testing when PostgreSQL is not available
    options.UseInMemoryDatabase("TestDb");
});

// Add services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AnalyticsService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Seed data for testing
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Add sample data
    if (!context.Users.Any())
    {
        context.Users.AddRange(
            new DotNetApi.Models.User { Name = "John Doe", Email = "john@example.com", Age = 25, City = "Bangkok" },
            new DotNetApi.Models.User { Name = "Jane Smith", Email = "jane@example.com", Age = 30, City = "Chiang Mai" },
            new DotNetApi.Models.User { Name = "Bob Johnson", Email = "bob@example.com", Age = 35, City = "Phuket" }
        );
        
        context.Products.AddRange(
            new DotNetApi.Models.Product { Name = "Laptop", Price = 25000, Category = "electronics", Stock = 50 },
            new DotNetApi.Models.Product { Name = "Smartphone", Price = 15000, Category = "electronics", Stock = 100 }
        );
        
        context.SaveChanges();
        
        // Add sample orders
        context.Orders.AddRange(
            new DotNetApi.Models.Order { UserId = 1, TotalAmount = 27500, Status = "completed" },
            new DotNetApi.Models.Order { UserId = 2, TotalAmount = 15000, Status = "pending" }
        );
        
        context.SaveChanges();
        
        // Add sample order items
        context.OrderItems.AddRange(
            new DotNetApi.Models.OrderItem { OrderId = 1, ProductId = 1, Quantity = 1, Price = 25000 },
            new DotNetApi.Models.OrderItem { OrderId = 2, ProductId = 2, Quantity = 1, Price = 15000 }
        );
        
        context.SaveChanges();
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    service = "dotnet-api"
});

app.Run(); 