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
        
        // Register complex DbContexts with relationships
        builder.AddNpgsqlDbContext<ECommerceDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=ecommerce_db")));
        
        builder.AddNpgsqlDbContext<OrganizationDbContext>("postgres", configureDbContextOptions: options =>
            options.UseNpgsql(connectionString.Replace("Database=dbadminpanel", "Database=organization_db")));

        // Add DBAdminPanel - this will scan all DbContexts and generate admin panels
        builder.Services.AddDBAdminPanel();

        // Configure CORS for local development
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins("http://localhost:4200")
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

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
        
        // Enable CORS - must be after UseRouting and before UseAuthorization
        app.UseCors();
        
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
                try
                {
                    // Check if database can be connected
                    if (!userContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to UserDbContext database. Creating database...");
                        userContext.Database.EnsureCreated();
                    }
                    userContext.Database.Migrate();
                    logger.LogInformation("UserDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying UserDbContext migrations: {Message}", ex.Message);
                    // Continue with other contexts even if one fails
                }
                
                var productContext = services.GetRequiredService<ProductDbContext>();
                try
                {
                    if (!productContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to ProductDbContext database. Creating database...");
                        productContext.Database.EnsureCreated();
                    }
                    productContext.Database.Migrate();
                    logger.LogInformation("ProductDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying ProductDbContext migrations: {Message}", ex.Message);
                }
                
                var orderContext = services.GetRequiredService<OrderDbContext>();
                try
                {
                    if (!orderContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to OrderDbContext database. Creating database...");
                        orderContext.Database.EnsureCreated();
                    }
                    orderContext.Database.Migrate();
                    logger.LogInformation("OrderDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying OrderDbContext migrations: {Message}", ex.Message);
                }
                
                var blogContext = services.GetRequiredService<BlogDbContext>();
                try
                {
                    if (!blogContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to BlogDbContext database. Creating database...");
                        blogContext.Database.EnsureCreated();
                    }
                    blogContext.Database.Migrate();
                    logger.LogInformation("BlogDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying BlogDbContext migrations: {Message}", ex.Message);
                }
                
                var categoryContext = services.GetRequiredService<CategoryDbContext>();
                try
                {
                    if (!categoryContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to CategoryDbContext database. Creating database...");
                        categoryContext.Database.EnsureCreated();
                    }
                    categoryContext.Database.Migrate();
                    logger.LogInformation("CategoryDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying CategoryDbContext migrations: {Message}", ex.Message);
                }
                
                var employeeContext = services.GetRequiredService<EmployeeDbContext>();
                try
                {
                    if (!employeeContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to EmployeeDbContext database. Creating database...");
                        employeeContext.Database.EnsureCreated();
                    }
                    employeeContext.Database.Migrate();
                    logger.LogInformation("EmployeeDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying EmployeeDbContext migrations: {Message}", ex.Message);
                }
                
                var invoiceContext = services.GetRequiredService<InvoiceDbContext>();
                try
                {
                    if (!invoiceContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to InvoiceDbContext database. Creating database...");
                        invoiceContext.Database.EnsureCreated();
                    }
                    invoiceContext.Database.Migrate();
                    logger.LogInformation("InvoiceDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying InvoiceDbContext migrations: {Message}", ex.Message);
                }
                
                var notificationContext = services.GetRequiredService<NotificationDbContext>();
                try
                {
                    if (!notificationContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to NotificationDbContext database. Creating database...");
                        notificationContext.Database.EnsureCreated();
                    }
                    notificationContext.Database.Migrate();
                    logger.LogInformation("NotificationDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying NotificationDbContext migrations: {Message}", ex.Message);
                }
                
                var ecommerceContext = services.GetRequiredService<ECommerceDbContext>();
                try
                {
                    if (!ecommerceContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to ECommerceDbContext database. Creating database...");
                        ecommerceContext.Database.EnsureCreated();
                    }
                    ecommerceContext.Database.Migrate();
                    logger.LogInformation("ECommerceDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying ECommerceDbContext migrations: {Message}", ex.Message);
                }
                
                var organizationContext = services.GetRequiredService<OrganizationDbContext>();
                try
                {
                    if (!organizationContext.Database.CanConnect())
                    {
                        logger.LogWarning("Cannot connect to OrganizationDbContext database. Creating database...");
                        organizationContext.Database.EnsureCreated();
                    }
                    organizationContext.Database.Migrate();
                    logger.LogInformation("OrganizationDbContext migrations applied.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error applying OrganizationDbContext migrations: {Message}", ex.Message);
                }
                
                logger.LogInformation("Migration process completed. Check logs above for any errors.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred during migration process: {Message}", ex.Message);
                // Don't throw - allow application to start even if some migrations fail
                // This allows the app to run and you can fix database issues separately
            }
        }

        app.Run();
    }
}
