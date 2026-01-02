using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace DBAdminPanel
{
    public static class DBAdminPanelExtensions
    {
        public static IServiceCollection AddDBAdminPanel(this IServiceCollection services)
        {
            var assembly = typeof(DBAdminPanelExtensions).Assembly;
            
            // Add the assembly as an application part so MVC can discover controllers
            // Generated controllers will be in the consuming project and automatically discovered
            services.AddControllers()
                .AddApplicationPart(assembly);
            
            // Make routes case-insensitive
            services.Configure<Microsoft.AspNetCore.Routing.RouteOptions>(options =>
            {
                options.LowercaseUrls = true;
                options.LowercaseQueryStrings = true;
            });
            
            return services;
        }

        public static IApplicationBuilder UseDBAdminPanel(this IApplicationBuilder app)
        {
            // Enable static files from wwwroot for /DBAdminPanel/ path
            var env = app.ApplicationServices.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            var webRootPath = env.WebRootPath ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot");
            
            // Ensure wwwroot directory exists
            if (!System.IO.Directory.Exists(webRootPath))
            {
                System.IO.Directory.CreateDirectory(webRootPath);
            }
            
            // Try to find wwwroot files - first in project wwwroot, then in package location
            IFileProvider fileProvider;
            try
            {
                if (System.IO.Directory.Exists(webRootPath) && System.IO.File.Exists(System.IO.Path.Combine(webRootPath, "index.html")))
                {
                    fileProvider = new PhysicalFileProvider(webRootPath);
                }
                else
                {
                    // Fallback to package wwwroot location
                    var assembly = typeof(DBAdminPanelExtensions).Assembly;
                    var assemblyLocation = System.IO.Path.GetDirectoryName(assembly.Location);
                    if (!string.IsNullOrEmpty(assemblyLocation))
                    {
                        var packageWwwRoot = System.IO.Path.Combine(assemblyLocation, "wwwroot");
                        if (System.IO.Directory.Exists(packageWwwRoot))
                        {
                            fileProvider = new PhysicalFileProvider(packageWwwRoot);
                        }
                        else
                        {
                            // Use project wwwroot (directory was created above)
                            fileProvider = new PhysicalFileProvider(webRootPath);
                        }
                    }
                    else
                    {
                        // Use project wwwroot (directory was created above)
                        fileProvider = new PhysicalFileProvider(webRootPath);
                    }
                }
            }
            catch
            {
                // If all else fails, use project wwwroot
                fileProvider = new PhysicalFileProvider(webRootPath);
            }
            
            app.UseStaticFiles(new StaticFileOptions
            {
                RequestPath = "/DBAdminPanel",
                FileProvider = fileProvider
            });
            // Routing is typically configured in UseEndpoints
            // This method is for any additional middleware configuration
            return app;
        }

        public static WebApplication UseDBAdminPanel(this WebApplication app)
        {
            // Enable static files from wwwroot for /DBAdminPanel/ path
            var webRootPath = app.Environment.WebRootPath ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot");
            
            // Ensure wwwroot directory exists
            if (!System.IO.Directory.Exists(webRootPath))
            {
                System.IO.Directory.CreateDirectory(webRootPath);
            }
            
            // Try to find wwwroot files - first in project wwwroot, then in package location
            IFileProvider fileProvider;
            try
            {
                if (System.IO.Directory.Exists(webRootPath) && System.IO.File.Exists(System.IO.Path.Combine(webRootPath, "index.html")))
                {
                    fileProvider = new PhysicalFileProvider(webRootPath);
                }
                else
                {
                    // Fallback to package wwwroot location
                    var assembly = typeof(DBAdminPanelExtensions).Assembly;
                    var assemblyLocation = System.IO.Path.GetDirectoryName(assembly.Location);
                    if (!string.IsNullOrEmpty(assemblyLocation))
                    {
                        var packageWwwRoot = System.IO.Path.Combine(assemblyLocation, "wwwroot");
                        if (System.IO.Directory.Exists(packageWwwRoot))
                        {
                            fileProvider = new PhysicalFileProvider(packageWwwRoot);
                        }
                        else
                        {
                            // Use project wwwroot (directory was created above)
                            fileProvider = new PhysicalFileProvider(webRootPath);
                        }
                    }
                    else
                    {
                        // Use project wwwroot (directory was created above)
                        fileProvider = new PhysicalFileProvider(webRootPath);
                    }
                }
            }
            catch
            {
                // If all else fails, use project wwwroot
                fileProvider = new PhysicalFileProvider(webRootPath);
            }
            
            app.UseStaticFiles(new StaticFileOptions
            {
                RequestPath = "/DBAdminPanel",
                FileProvider = fileProvider
            });
            // Overload for WebApplication (minimal hosting)
            // Routing is typically configured via MapControllers/MapControllerRoute
            return app;
        }
    }
}

