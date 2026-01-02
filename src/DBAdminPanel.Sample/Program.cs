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

        // Ensure databases are created
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                services.GetRequiredService<UserDbContext>().Database.EnsureCreated();
                services.GetRequiredService<ProductDbContext>().Database.EnsureCreated();
                services.GetRequiredService<OrderDbContext>().Database.EnsureCreated();
                services.GetRequiredService<BlogDbContext>().Database.EnsureCreated();
                services.GetRequiredService<CategoryDbContext>().Database.EnsureCreated();
                services.GetRequiredService<EmployeeDbContext>().Database.EnsureCreated();
                services.GetRequiredService<InvoiceDbContext>().Database.EnsureCreated();
                services.GetRequiredService<NotificationDbContext>().Database.EnsureCreated();
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred creating the databases.");
            }
        }

        app.Run();
    }
}
