using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Data;
using DBAdminPanel;

namespace DBAdminPanel.Sample;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.AddServiceDefaults();

        // Add services to the container.
        builder.Services.AddControllersWithViews();

        // Configure PostgreSQL connections for all 8 DbContexts
        // In Aspire, the connection string will be automatically injected via WithReference
        var connectionString = builder.Configuration.GetConnectionString("postgres") 
            ?? "Host=localhost;Port=5432;Database=dbadminpanel;Username=postgres;Password=postgres";

        // Register all 8 DbContexts with different databases
        // Using AddNpgsqlDbContext from Aspire ensures health checks and proper connection handling
        builder.AddNpgsqlDbContext<UserDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=users_db")));
        
        builder.AddNpgsqlDbContext<ProductDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=products_db")));
        
        builder.AddNpgsqlDbContext<OrderDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=orders_db")));
        
        builder.AddNpgsqlDbContext<BlogDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=blog_db")));
        
        builder.AddNpgsqlDbContext<CategoryDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=categories_db")));
        
        builder.AddNpgsqlDbContext<EmployeeDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=employees_db")));
        
        builder.AddNpgsqlDbContext<InvoiceDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=invoices_db")));
        
        builder.AddNpgsqlDbContext<NotificationDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=notifications_db")));

        // Add DBAdminPanel - this will scan all DbContexts and generate admin panels
        builder.Services.AddDBAdminPanel();

        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        var app = builder.Build();

        app.MapDefaultEndpoints();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");

        app.MapControllers();

        // Use DBAdminPanel
        app.UseDBAdminPanel();

        // Apply migrations for all DbContexts
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<Program>>();
            try
            {
                logger.LogInformation("Applying migrations for all DbContexts...");
                
                // Apply migrations for each DbContext
                var userContext = services.GetRequiredService<UserDbContext>();
                userContext.Database.Migrate();
                logger.LogInformation("UserDbContext migrations applied.");
                
                var productContext = services.GetRequiredService<ProductDbContext>();
                productContext.Database.Migrate();
                logger.LogInformation("ProductDbContext migrations applied.");
                
                var orderContext = services.GetRequiredService<OrderDbContext>();
                orderContext.Database.Migrate();
                logger.LogInformation("OrderDbContext migrations applied.");
                
                var blogContext = services.GetRequiredService<BlogDbContext>();
                blogContext.Database.Migrate();
                logger.LogInformation("BlogDbContext migrations applied.");
                
                var categoryContext = services.GetRequiredService<CategoryDbContext>();
                categoryContext.Database.Migrate();
                logger.LogInformation("CategoryDbContext migrations applied.");
                
                var employeeContext = services.GetRequiredService<EmployeeDbContext>();
                employeeContext.Database.Migrate();
                logger.LogInformation("EmployeeDbContext migrations applied.");
                
                var invoiceContext = services.GetRequiredService<InvoiceDbContext>();
                invoiceContext.Database.Migrate();
                logger.LogInformation("InvoiceDbContext migrations applied.");
                
                var notificationContext = services.GetRequiredService<NotificationDbContext>();
                notificationContext.Database.Migrate();
                logger.LogInformation("NotificationDbContext migrations applied.");
                
                logger.LogInformation("All migrations applied successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred applying migrations.");
                throw;
            }
        }

        app.Run();
    }
}
