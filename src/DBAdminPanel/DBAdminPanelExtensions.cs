using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace DBAdminPanel
{
    public static class DBAdminPanelExtensions
    {
        public static IServiceCollection AddDBAdminPanel(this IServiceCollection services)
        {
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

            // Map generated endpoints using reflection
            MapGeneratedEndpoints(app);
            
            return app;
        }

        private static void MapGeneratedEndpoints(WebApplication app)
        {
            // Find and call the generated endpoint mapping methods using reflection
            var entryAssembly = System.Reflection.Assembly.GetEntryAssembly();
            if (entryAssembly == null) return;

            try
            {
                // Map entity endpoints
                var entityEndpointsType = entryAssembly.GetType("DBAdminPanel.Generated.Endpoints.EntityEndpoints");
                if (entityEndpointsType != null)
                {
                    var mapAllMethod = entityEndpointsType.GetMethod("MapAllEntityEndpoints", 
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    if (mapAllMethod != null)
                    {
                        mapAllMethod.Invoke(null, new object[] { app });
                    }
                }

                // Map metadata endpoints
                var metadataEndpointsType = entryAssembly.GetType("DBAdminPanel.Generated.Endpoints.MetadataEndpoints");
                if (metadataEndpointsType != null)
                {
                    var mapMethod = metadataEndpointsType.GetMethod("MapMetadataEndpoints", 
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    if (mapMethod != null)
                    {
                        mapMethod.Invoke(null, new object[] { app });
                    }
                }

                // Map dashboard endpoints
                var dashboardEndpointsType = entryAssembly.GetType("DBAdminPanel.Generated.Endpoints.DashboardEndpoints");
                if (dashboardEndpointsType != null)
                {
                    var mapMethod = dashboardEndpointsType.GetMethod("MapDashboardEndpoints", 
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    if (mapMethod != null)
                    {
                        mapMethod.Invoke(null, new object[] { app });
                    }
                }

                // Map diagram endpoints
                var diagramEndpointsType = entryAssembly.GetType("DBAdminPanel.Generated.Endpoints.DiagramEndpoints");
                if (diagramEndpointsType != null)
                {
                    var mapMethod = diagramEndpointsType.GetMethod("MapDiagramEndpoints", 
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    if (mapMethod != null)
                    {
                        mapMethod.Invoke(null, new object[] { app });
                    }
                }

                // Map SQL execution endpoints
                var sqlExecutionEndpointsType = entryAssembly.GetType("DBAdminPanel.Generated.Endpoints.SqlExecutionEndpoints");
                if (sqlExecutionEndpointsType != null)
                {
                    var mapMethod = sqlExecutionEndpointsType.GetMethod("MapSqlExecutionEndpoints", 
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    if (mapMethod != null)
                    {
                        mapMethod.Invoke(null, new object[] { app });
                    }
                }
            }
            catch (System.Exception)
            {
                // If reflection fails, endpoints may not be generated yet or assembly may not be loaded
                // This is expected during development when source generation hasn't run yet
            }
        }
    }
}

