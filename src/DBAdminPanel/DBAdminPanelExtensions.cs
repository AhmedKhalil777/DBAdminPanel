using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Razor;
using System.Collections.Generic;
using System.Linq;

namespace DBAdminPanel
{
    public static class DBAdminPanelExtensions
    {
        public static IServiceCollection AddDBAdminPanel(this IServiceCollection services)
        {
            var assembly = typeof(DBAdminPanelExtensions).Assembly;
            
            // Add the assembly as an application part so MVC can discover views and controllers
            // Generated controllers will be in the consuming project and automatically discovered
            services.AddControllersWithViews()
                .AddApplicationPart(assembly);
            
            // Make routes case-insensitive
            services.Configure<Microsoft.AspNetCore.Routing.RouteOptions>(options =>
            {
                options.LowercaseUrls = true;
                options.LowercaseQueryStrings = true;
            });
            
            // Add custom view location expander to find views in the package
            services.Configure<RazorViewEngineOptions>(options =>
            {
                options.ViewLocationExpanders.Add(new DBAdminPanelViewLocationExpander());
            });
            
            return services;
        }

        public static IApplicationBuilder UseDBAdminPanel(this IApplicationBuilder app)
        {
            // Enable static files from wwwroot
            app.UseStaticFiles();
            // Routing is typically configured in UseEndpoints
            // This method is for any additional middleware configuration
            return app;
        }

        public static WebApplication UseDBAdminPanel(this WebApplication app)
        {
            // Enable static files from wwwroot
            app.UseStaticFiles();
            // Overload for WebApplication (minimal hosting)
            // Routing is typically configured via MapControllers/MapControllerRoute
            return app;
        }
    }

    public class DBAdminPanelViewLocationExpander : IViewLocationExpander
    {
        public void PopulateValues(ViewLocationExpanderContext context)
        {
            // No values to populate
        }

        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            // Add view locations from the DBAdminPanel package assembly
            var assembly = typeof(DBAdminPanelExtensions).Assembly;
            var assemblyName = assembly.GetName().Name;
            
            // For Razor Class Library, views are compiled and available via the assembly
            // Add standard view locations that MVC will check
            return viewLocations.Concat(new[]
            {
                $"/Views/DBAdminPanel/{{1}}/{{0}}.cshtml",
                $"/Views/DBAdminPanel/Shared/{{0}}.cshtml",
                $"/Areas/DBAdminPanel/Views/{{1}}/{{0}}.cshtml",
                $"/Areas/DBAdminPanel/Views/Shared/{{0}}.cshtml"
            });
        }
    }
}

