using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DBAdminPanel.SourceGenerator
{
    [Generator]
    public class DBAdminPanelGenerator : ISourceGenerator
    {
        public void Initialize(GeneratorInitializationContext context)
        {
            context.RegisterForSyntaxNotifications(() => new DbContextSyntaxReceiver());
        }

        public void Execute(GeneratorExecutionContext context)
        {
            if (!(context.SyntaxReceiver is DbContextSyntaxReceiver receiver))
                return;

            var compilation = context.Compilation;
            var dbContextType = compilation.GetTypeByMetadataName("Microsoft.EntityFrameworkCore.DbContext");
            if (dbContextType == null) return;

            var allDbContextEntities = new List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)>();
            
            foreach (var dbContextSyntax in receiver.DbContextCandidates)
            {
                var semanticModel = compilation.GetSemanticModel(dbContextSyntax.SyntaxTree);
                var dbContextSymbol = semanticModel.GetDeclaredSymbol(dbContextSyntax) as INamedTypeSymbol;
                if (dbContextSymbol == null || !EntityAnalyzer.IsDbContext(dbContextSymbol, dbContextType)) continue;

                var entities = EntityAnalyzer.GetEntitiesFromDbContext(dbContextSymbol, dbContextType);
                if (entities.Any())
                {
                    allDbContextEntities.Add((dbContextSymbol, entities));
                }
            }

            if (!allDbContextEntities.Any()) return;

            Generators.JsonConverterGenerator.Generate(context);
            Generators.MetadataClassesGenerator.Generate(context, allDbContextEntities);
            Generators.EntityEndpointsGenerator.Generate(context, allDbContextEntities);
            GenerateMetadataEndpoints(context, allDbContextEntities);
            GenerateDashboardEndpoints(context, allDbContextEntities);
            GenerateDiagramEndpoints(context, allDbContextEntities);
            GenerateSqlExecutionEndpoints(context, allDbContextEntities);
        }




        // Removed - now in Generators.EntityEndpointsGenerator
        private void GenerateEntityEndpoints_OLD(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            // Generate endpoint mapping methods for all entities
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Builder;");
            sb.AppendLine("using Microsoft.AspNetCore.Http;");
            sb.AppendLine("using Microsoft.AspNetCore.Http.HttpResults;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore;");
            sb.AppendLine("using System.Text.Json;");
            sb.AppendLine("using System.Text.Json.Serialization;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Endpoints");
            sb.AppendLine("{");
            sb.AppendLine("    public static class EntityEndpoints");
            sb.AppendLine("    {");
            sb.AppendLine("        private static void NormalizeDateTimeProperties(object entity)");
            sb.AppendLine("        {");
            sb.AppendLine("            if (entity == null) return;");
            sb.AppendLine("            var entityType = entity.GetType();");
            sb.AppendLine("            var properties = entityType.GetProperties(BindingFlags.Public | BindingFlags.Instance);");
            sb.AppendLine("            foreach (var prop in properties)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (prop.PropertyType == typeof(DateTime))");
            sb.AppendLine("                {");
            sb.AppendLine("                    var value = prop.GetValue(entity);");
            sb.AppendLine("                    if (value is DateTime dt && dt.Kind == DateTimeKind.Unspecified)");
            sb.AppendLine("                    {");
            sb.AppendLine("                        prop.SetValue(entity, DateTime.SpecifyKind(dt, DateTimeKind.Utc));");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine("                else if (prop.PropertyType == typeof(DateTime?))");
            sb.AppendLine("                {");
            sb.AppendLine("                    var value = prop.GetValue(entity);");
            sb.AppendLine("                    if (value != null)");
            sb.AppendLine("                    {");
            sb.AppendLine("                        var nullableDt = (DateTime?)value;");
            sb.AppendLine("                        if (nullableDt.HasValue && nullableDt.Value.Kind == DateTimeKind.Unspecified)");
            sb.AppendLine("                        {");
            sb.AppendLine("                            prop.SetValue(entity, DateTime.SpecifyKind(nullableDt.Value, DateTimeKind.Utc));");
            sb.AppendLine("                        }");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine();

            // Generate endpoint mapping method for each entity
            foreach (var (dbContext, entities) in allEntities)
            {
                foreach (var entity in entities)
                {
                    GenerateSingleEntityEndpoints(sb, entity);
                }
            }

            // Generate method to map all entity endpoints
            sb.AppendLine("        public static void MapAllEntityEndpoints(this WebApplication app)");
            sb.AppendLine("        {");
            foreach (var (dbContext, entities) in allEntities)
            {
                foreach (var entity in entities)
                {
                    sb.AppendLine($"            app.Map{entity.Name}Endpoints();");
                }
            }
            sb.AppendLine("        }");

            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("EntityEndpoints.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private void GenerateSingleEntityEndpoints(StringBuilder sb, EntityInfo entity)
        {
            sb.AppendLine($"        public static void Map{entity.Name}Endpoints(this WebApplication app)");
            sb.AppendLine("        {");
            sb.AppendLine($"            var group = app.MapGroup(\"DBAdminPanel/{entity.Name}\");");
            sb.AppendLine();
            
            // GET all (with pagination support)
            sb.AppendLine("            group.MapGet(\"api\", async (");
            sb.AppendLine($"                {entity.DbContextFullName} dbContext, int? page = null, int? pageSize = null) =>");
            sb.AppendLine("            {");
            sb.AppendLine($"                var query = dbContext.{entity.DbSetName}.AsQueryable();");
            sb.AppendLine("                var totalCount = await query.CountAsync();");
            sb.AppendLine("                ");
            sb.AppendLine("                if (page.HasValue && pageSize.HasValue && page.Value > 0 && pageSize.Value > 0)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var skip = (page.Value - 1) * pageSize.Value;");
            sb.AppendLine("                    query = query.Skip(skip).Take(pageSize.Value);");
            sb.AppendLine("                }");
            sb.AppendLine("                ");
            sb.AppendLine("                var entities = await query.ToListAsync();");
            sb.AppendLine("                ");
            sb.AppendLine("                return Results.Json(new {");
            sb.AppendLine("                    data = entities,");
            sb.AppendLine("                    totalCount = totalCount,");
            sb.AppendLine("                    page = page ?? 1,");
            sb.AppendLine("                    pageSize = pageSize ?? totalCount");
            sb.AppendLine("                }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });");
            sb.AppendLine("            });");
            sb.AppendLine();

            // GET by id
            sb.AppendLine("            group.MapGet(\"api/{id}\", async (");
            sb.AppendLine($"                string id, {entity.DbContextFullName} dbContext) =>");
            sb.AppendLine("            {");
            
            // Parse key based on type
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!int.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!long.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("                if (!System.Guid.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else
            {
                sb.AppendLine($"                object key;");
                sb.AppendLine("                try");
                sb.AppendLine("                {");
                sb.AppendLine($"                    key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
                sb.AppendLine("                }");
                sb.AppendLine("                catch");
                sb.AppendLine("                {");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
                sb.AppendLine("                }");
            }
            
            sb.AppendLine($"                var entity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("                if (entity == null) return Results.NotFound();");
            sb.AppendLine("                return Results.Json(entity);");
            sb.AppendLine("            });");
            sb.AppendLine();

            // POST create
            sb.AppendLine("            group.MapPost(\"api\", async (");
            sb.AppendLine($"                System.Text.Json.JsonElement data, {entity.DbContextFullName} dbContext) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };");
            sb.AppendLine("                options.Converters.Add(new DBAdminPanel.Generated.Controllers.StringToNumberConverter());");
            sb.AppendLine($"                var entity = JsonSerializer.Deserialize<{entity.FullName}>(data.GetRawText(), options);");
            sb.AppendLine("                if (entity == null) return Results.BadRequest(\"Invalid entity data\");");
            sb.AppendLine("                NormalizeDateTimeProperties(entity);");
            sb.AppendLine($"                dbContext.{entity.DbSetName}.Add(entity);");
            sb.AppendLine("                await dbContext.SaveChangesAsync();");
            sb.AppendLine("                return Results.Ok(entity);");
            sb.AppendLine("            });");
            sb.AppendLine();

            // PUT update
            sb.AppendLine("            group.MapPut(\"api/{id}\", async (");
            sb.AppendLine($"                string id, System.Text.Json.JsonElement data, {entity.DbContextFullName} dbContext) =>");
            sb.AppendLine("            {");
            
            // Parse key
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!int.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!long.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("                if (!System.Guid.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else
            {
                sb.AppendLine($"                object key;");
                sb.AppendLine("                try");
                sb.AppendLine("                {");
                sb.AppendLine($"                    key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
                sb.AppendLine("                }");
                sb.AppendLine("                catch");
                sb.AppendLine("                {");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
                sb.AppendLine("                }");
            }
            
            sb.AppendLine($"                var existingEntity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("                if (existingEntity == null) return Results.NotFound();");
            sb.AppendLine("                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };");
            sb.AppendLine("                options.Converters.Add(new DBAdminPanel.Generated.Controllers.StringToNumberConverter());");
            sb.AppendLine($"                var updatedEntity = JsonSerializer.Deserialize<{entity.FullName}>(data.GetRawText(), options);");
            sb.AppendLine("                if (updatedEntity == null) return Results.BadRequest(\"Invalid entity data\");");
            sb.AppendLine("                NormalizeDateTimeProperties(updatedEntity);");
            sb.AppendLine("                dbContext.Entry(existingEntity).CurrentValues.SetValues(updatedEntity);");
            sb.AppendLine("                await dbContext.SaveChangesAsync();");
            sb.AppendLine("                return Results.Ok(existingEntity);");
            sb.AppendLine("            });");
            sb.AppendLine();

            // DELETE
            sb.AppendLine("            group.MapDelete(\"api/{id}\", async (");
            sb.AppendLine($"                string id, {entity.DbContextFullName} dbContext) =>");
            sb.AppendLine("            {");
            
            // Parse key
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!int.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("                if (!long.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("                if (!System.Guid.TryParse(id, out var key))");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
            }
            else
            {
                sb.AppendLine($"                object key;");
                sb.AppendLine("                try");
                sb.AppendLine("                {");
                sb.AppendLine($"                    key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
                sb.AppendLine("                }");
                sb.AppendLine("                catch");
                sb.AppendLine("                {");
                sb.AppendLine("                    return Results.BadRequest(\"Invalid ID format\");");
                sb.AppendLine("                }");
            }
            
            sb.AppendLine($"                var entity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("                if (entity == null) return Results.NotFound();");
            sb.AppendLine($"                dbContext.{entity.DbSetName}.Remove(entity);");
            sb.AppendLine("                await dbContext.SaveChangesAsync();");
            sb.AppendLine("                return Results.Ok();");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine();
        }


        private void GenerateMetadataEndpoints(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Builder;");
            sb.AppendLine("using Microsoft.AspNetCore.Http;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using DBAdminPanel.Generated;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Endpoints");
            sb.AppendLine("{");
            sb.AppendLine("    public static class MetadataEndpoints");
            sb.AppendLine("    {");
            sb.AppendLine("        public static void MapMetadataEndpoints(this WebApplication app)");
            sb.AppendLine("        {");
            sb.AppendLine("            var group = app.MapGroup(\"DBAdminPanel/api\");");
            sb.AppendLine();
            sb.AppendLine("            group.MapGet(\"metadata\", (IServiceProvider serviceProvider) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var entities = EntityMetadata.GetAllEntities();");
            sb.AppendLine("                using var scope = serviceProvider.CreateScope();");
            sb.AppendLine("                var scopedProvider = scope.ServiceProvider;");
            sb.AppendLine();
            sb.AppendLine("                // Materialize results before scope is disposed");
            sb.AppendLine("                var result = entities.Select(e =>");
            sb.AppendLine("                {");
            sb.AppendLine("                    // Get DbContext for this entity to detect database type");
            sb.AppendLine("                    Microsoft.EntityFrameworkCore.DbContext? dbContext = null;");
            
            // Generate code to get DbContext for each entity
            foreach (var (dbContext, entities) in allEntities)
            {
                var dbContextFullName = dbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
                var dbContextName = dbContext.Name;
                foreach (var entity in entities)
                {
                    sb.AppendLine($"                    if (e.DbContextName == \"{dbContextName}\" || e.DbContextName == \"{dbContextName.Replace("DbContext", "")}\")");
                    sb.AppendLine("                    {");
                    sb.AppendLine($"                        dbContext = scopedProvider.GetService<{dbContextFullName}>();");
                    sb.AppendLine("                    }");
                }
            }
            
            sb.AppendLine();
            sb.AppendLine("                    var databaseType = DatabaseTypeDetector.GetDatabaseType(dbContext);");
            sb.AppendLine();
            sb.AppendLine("                    return new");
            sb.AppendLine("                    {");
            sb.AppendLine("                        name = e.Name,");
            sb.AppendLine("                        fullName = e.FullName,");
            sb.AppendLine("                        dbSetName = e.DbSetName,");
            sb.AppendLine("                        keyProperty = e.KeyProperty,");
            sb.AppendLine("                        dbContextName = e.DbContextName,");
            sb.AppendLine("                        dbContextFullName = e.DbContextFullName,");
            sb.AppendLine("                        databaseType = databaseType,");
            sb.AppendLine("                        properties = e.Properties,");
            sb.AppendLine("                        apiEndpoints = e.ApiEndpoints");
            sb.AppendLine("                    };");
            sb.AppendLine("                }).ToList();");
            sb.AppendLine();
            sb.AppendLine("                return Results.Ok(result);");
            sb.AppendLine("            });");
            sb.AppendLine();
            sb.AppendLine("            group.MapGet(\"entities\", () =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var entities = EntityMetadata.GetAllEntities();");
            sb.AppendLine("                return Results.Ok(entities.Select(e => new");
            sb.AppendLine("                {");
            sb.AppendLine("                    name = e.Name,");
            sb.AppendLine("                    fullName = e.FullName,");
            sb.AppendLine("                    dbSetName = e.DbSetName,");
            sb.AppendLine("                    keyProperty = e.KeyProperty,");
            sb.AppendLine("                    dbContextName = e.DbContextName,");
            sb.AppendLine("                    dbContextFullName = e.DbContextFullName,");
            sb.AppendLine("                    properties = e.Properties,");
            sb.AppendLine("                    apiEndpoints = e.ApiEndpoints");
            sb.AppendLine("                }));");
            sb.AppendLine("            });");
            sb.AppendLine();
            sb.AppendLine("            group.MapGet(\"metadata/{entityName}\", (string entityName, IServiceProvider serviceProvider) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var metadata = EntityMetadata.GetEntityMetadata(entityName);");
            sb.AppendLine("                if (metadata == null) return Results.NotFound();");
            sb.AppendLine();
            sb.AppendLine("                // Get DbContext for this entity to detect database type");
            sb.AppendLine("                Microsoft.EntityFrameworkCore.DbContext? dbContext = null;");
            sb.AppendLine("                using var scope = serviceProvider.CreateScope();");
            sb.AppendLine("                var scopedProvider = scope.ServiceProvider;");
            
            // Generate code to get DbContext for each entity
            foreach (var (dbContext, entities) in allEntities)
            {
                var dbContextFullName = dbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
                var dbContextName = dbContext.Name;
                foreach (var entity in entities)
                {
                    sb.AppendLine($"                if (metadata.DbContextName == \"{dbContextName}\" || metadata.DbContextName == \"{dbContextName.Replace("DbContext", "")}\")");
                    sb.AppendLine("                {");
                    sb.AppendLine($"                    dbContext = scopedProvider.GetService<{dbContextFullName}>();");
                    sb.AppendLine("                }");
                }
            }
            
            sb.AppendLine();
            sb.AppendLine("                var databaseType = DatabaseTypeDetector.GetDatabaseType(dbContext);");
            sb.AppendLine();
            sb.AppendLine("                return Results.Ok(new");
            sb.AppendLine("                {");
            sb.AppendLine("                    name = metadata.Name,");
            sb.AppendLine("                    fullName = metadata.FullName,");
            sb.AppendLine("                    dbSetName = metadata.DbSetName,");
            sb.AppendLine("                    keyProperty = metadata.KeyProperty,");
            sb.AppendLine("                    dbContextName = metadata.DbContextName,");
            sb.AppendLine("                    dbContextFullName = metadata.DbContextFullName,");
            sb.AppendLine("                    databaseType = databaseType,");
            sb.AppendLine("                    properties = metadata.Properties,");
            sb.AppendLine("                    apiEndpoints = metadata.ApiEndpoints");
            sb.AppendLine("                });");
            sb.AppendLine("            });");
            sb.AppendLine();
            sb.AppendLine("            group.MapGet(\"entities/{entityName}/metadata\", (string entityName) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var metadata = EntityMetadata.GetEntityMetadata(entityName);");
            sb.AppendLine("                if (metadata == null) return Results.NotFound();");
            sb.AppendLine("                return Results.Ok(new");
            sb.AppendLine("                {");
            sb.AppendLine("                    name = metadata.Name,");
            sb.AppendLine("                    fullName = metadata.FullName,");
            sb.AppendLine("                    dbSetName = metadata.DbSetName,");
            sb.AppendLine("                    keyProperty = metadata.KeyProperty,");
            sb.AppendLine("                    dbContextName = metadata.DbContextName,");
            sb.AppendLine("                    dbContextFullName = metadata.DbContextFullName,");
            sb.AppendLine("                    properties = metadata.Properties,");
            sb.AppendLine("                    apiEndpoints = metadata.ApiEndpoints");
            sb.AppendLine("                });");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("MetadataEndpoints.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private void GenerateDashboardEndpoints(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Builder;");
            sb.AppendLine("using Microsoft.AspNetCore.Http;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Endpoints");
            sb.AppendLine("{");
            sb.AppendLine("    public static class DashboardEndpoints");
            sb.AppendLine("    {");
            sb.AppendLine("        public static void MapDashboardEndpoints(this WebApplication app)");
            sb.AppendLine("        {");
            sb.AppendLine("            app.MapGet(\"DBAdminPanel\", (Microsoft.AspNetCore.Hosting.IWebHostEnvironment env) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var webRootPath = env.WebRootPath ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), \"wwwroot\");");
            sb.AppendLine("                // Files are copied to wwwroot root during build (from browser subdirectory)");
            sb.AppendLine("                var indexPath = System.IO.Path.Combine(webRootPath, \"index.html\");");
            sb.AppendLine("                if (System.IO.File.Exists(indexPath))");
            sb.AppendLine("                {");
            sb.AppendLine("                    return Results.File(indexPath, \"text/html\");");
            sb.AppendLine("                }");
            sb.AppendLine("                return Results.NotFound(\"Angular app not found. Please build the Angular application.\");");
            sb.AppendLine("            });");
            sb.AppendLine();
            sb.AppendLine("            app.MapGet(\"DBAdminPanel/Index\", (Microsoft.AspNetCore.Hosting.IWebHostEnvironment env) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var webRootPath = env.WebRootPath ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), \"wwwroot\");");
            sb.AppendLine("                // Files are copied to wwwroot root during build (from browser subdirectory)");
            sb.AppendLine("                var indexPath = System.IO.Path.Combine(webRootPath, \"index.html\");");
            sb.AppendLine("                if (System.IO.File.Exists(indexPath))");
            sb.AppendLine("                {");
            sb.AppendLine("                    return Results.File(indexPath, \"text/html\");");
            sb.AppendLine("                }");
            sb.AppendLine("                return Results.NotFound(\"Angular app not found. Please build the Angular application.\");");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("DashboardEndpoints.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private void GenerateDiagramEndpoints(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Builder;");
            sb.AppendLine("using Microsoft.AspNetCore.Http;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore.Metadata;");
            sb.AppendLine("using Microsoft.Extensions.DependencyInjection;");
            sb.AppendLine("using System.Collections.Generic;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine("using System.IO;");
            sb.AppendLine("using DBAdminPanel.Generated;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Endpoints");
            sb.AppendLine("{");
            sb.AppendLine("    public static class DiagramEndpoints");
            sb.AppendLine("    {");
            sb.AppendLine("        public static void MapDiagramEndpoints(this WebApplication app)");
            sb.AppendLine("        {");
            sb.AppendLine("            var group = app.MapGroup(\"DBAdminPanel/api\");");
            sb.AppendLine();
            sb.AppendLine("            group.MapGet(\"diagram\", (IServiceProvider serviceProvider) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                var diagramData = new List<DiagramTableInfo>();");
            sb.AppendLine("                var allEntities = EntityMetadata.GetAllEntities();");
            sb.AppendLine("                System.Console.WriteLine($\"Diagram endpoint called. Found {allEntities.Count} entities in metadata.\");");
            sb.AppendLine();
            
            // Generate code to get DbContext instances and extract model metadata
            foreach (var (dbContext, entities) in allEntities)
            {
                var dbContextVarName = dbContext.Name.ToLowerInvariant();
                var dbContextName = dbContext.Name;
                sb.AppendLine($"                // Process {dbContextName}");
                sb.AppendLine($"                try");
                sb.AppendLine("                {");
                sb.AppendLine($"                    using var {dbContextVarName}Scope = serviceProvider.CreateScope();");
                sb.AppendLine($"                    var {dbContextVarName}Service = {dbContextVarName}Scope.ServiceProvider.GetService<{dbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)}>();");
                sb.AppendLine($"                    if ({dbContextVarName}Service != null)");
                sb.AppendLine("                    {");
                sb.AppendLine($"                        var {dbContextVarName}Model = {dbContextVarName}Service.Model;");
                sb.AppendLine($"                        var {dbContextVarName}EntityTypes = {dbContextVarName}Model.GetEntityTypes().ToList();");
                sb.AppendLine();
                
                foreach (var entity in entities)
                {
                    var entityVarName = entity.Name.ToLowerInvariant();
                    sb.AppendLine($"                        // Process {entity.Name}");
                    sb.AppendLine($"                        var {entityVarName}EntityType = {dbContextVarName}EntityTypes.FirstOrDefault(et => et.ClrType.FullName == \"{entity.FullName}\" || et.ClrType.Name == \"{entity.Name}\");");
                    sb.AppendLine($"                        if ({entityVarName}EntityType != null)");
                    sb.AppendLine("                        {");
                    sb.AppendLine($"                            var {entityVarName}Table = new DiagramTableInfo");
                    sb.AppendLine("                            {");
                    sb.AppendLine($"                                Name = \"{entity.Name}\",");
                    sb.AppendLine($"                                FullName = {entityVarName}EntityType.ClrType.FullName ?? \"{entity.FullName}\",");
                    sb.AppendLine($"                                TableName = {entityVarName}EntityType.GetTableName() ?? \"{entity.Name}\",");
                    sb.AppendLine($"                                DbContextName = \"{entity.DbContextName}\",");
                    sb.AppendLine($"                                ModelFilePath = GetModelFilePath({entityVarName}EntityType.ClrType.FullName ?? \"{entity.FullName}\"),");
                    sb.AppendLine($"                                Columns = {entityVarName}EntityType.GetProperties().Select(p => new DiagramColumnInfo");
                    sb.AppendLine("                                {");
                    sb.AppendLine("                                    Name = p.Name,");
                    sb.AppendLine("                                    Type = p.ClrType.Name,");
                    sb.AppendLine("                                    FullType = p.ClrType.FullName ?? p.ClrType.Name,");
                    sb.AppendLine("                                    IsNullable = p.IsNullable,");
                    sb.AppendLine("                                    IsPrimaryKey = p.IsPrimaryKey(),");
                    sb.AppendLine("                                    IsForeignKey = p.IsForeignKey()");
                    sb.AppendLine("                                }).ToList(),");
                    sb.AppendLine($"                                Relations = {entityVarName}EntityType.GetForeignKeys().Select(fk => new DiagramRelationInfo");
                    sb.AppendLine("                                {");
                    sb.AppendLine("                                    FromTable = fk.DeclaringEntityType.GetTableName() ?? fk.DeclaringEntityType.ClrType.Name,");
                    sb.AppendLine("                                    ToTable = fk.PrincipalEntityType.GetTableName() ?? fk.PrincipalEntityType.ClrType.Name,");
                    sb.AppendLine("                                    FromColumn = string.Join(\",\", fk.Properties.Select(p => p.GetColumnName() ?? p.Name)),");
                    sb.AppendLine("                                    ToColumn = string.Join(\",\", fk.PrincipalKey.Properties.Select(p => p.GetColumnName() ?? p.Name)),");
                    sb.AppendLine("                                    RelationshipType = fk.IsRequired ? \"OneToOne\" : \"OneToMany\"");
                    sb.AppendLine("                                }).ToList()");
                    sb.AppendLine("                            };");
                    sb.AppendLine($"                            diagramData.Add({entityVarName}Table);");
                    sb.AppendLine("                        }");
                }
                
                sb.AppendLine("                    }");
                sb.AppendLine("                }");
                sb.AppendLine("                catch (System.Exception ex)");
                sb.AppendLine("                {");
                sb.AppendLine("                    // DbContext may not be registered or available");
                sb.AppendLine($"                    System.Console.WriteLine($\"Error processing {dbContextName}: {{ex.Message}}\");");
                sb.AppendLine("                }");
            }
            
            sb.AppendLine();
            sb.AppendLine("                // Fallback: If no data from DbContext, use metadata from EntityMetadata");
            sb.AppendLine("                if (diagramData.Count == 0)");
            sb.AppendLine("                {");
            sb.AppendLine("                    System.Console.WriteLine($\"No data from DbContext, using fallback. EntityMetadata has {allEntities.Count} entities.\");");
            sb.AppendLine("                    if (allEntities.Count > 0)");
            sb.AppendLine("                    {");
            sb.AppendLine("                        foreach (var entityMetadata in allEntities)");
            sb.AppendLine("                        {");
            sb.AppendLine("                            try");
            sb.AppendLine("                            {");
            sb.AppendLine("                                diagramData.Add(new DiagramTableInfo");
            sb.AppendLine("                                {");
            sb.AppendLine("                                    Name = entityMetadata.Name,");
            sb.AppendLine("                                    FullName = entityMetadata.FullName,");
            sb.AppendLine("                                    TableName = entityMetadata.Name,");
            sb.AppendLine("                                    DbContextName = entityMetadata.DbContextName,");
            sb.AppendLine("                                    ModelFilePath = GetModelFilePath(entityMetadata.FullName),");
            sb.AppendLine("                                    Columns = entityMetadata.Properties?.Select(p => new DiagramColumnInfo");
            sb.AppendLine("                                    {");
            sb.AppendLine("                                        Name = p.Name,");
            sb.AppendLine("                                        Type = p.Type.Split('.').LastOrDefault() ?? p.Type,");
            sb.AppendLine("                                        FullType = p.Type,");
            sb.AppendLine("                                        IsNullable = !p.Type.Contains(\"System.String\") && p.Type.EndsWith(\"?\"),");
            sb.AppendLine("                                        IsPrimaryKey = p.IsKey,");
            sb.AppendLine("                                        IsForeignKey = false");
            sb.AppendLine("                                    }).ToList() ?? new List<DiagramColumnInfo>(),");
            sb.AppendLine("                                    Relations = new List<DiagramRelationInfo>()");
            sb.AppendLine("                                });");
            sb.AppendLine("                            }");
            sb.AppendLine("                            catch (System.Exception ex)");
            sb.AppendLine("                            {");
            sb.AppendLine("                                System.Console.WriteLine($\"Error processing entity {entityMetadata.Name}: {ex.Message}\");");
            sb.AppendLine("                            }");
            sb.AppendLine("                        }");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine();
            sb.AppendLine("                System.Console.WriteLine($\"Returning {diagramData.Count} tables in diagram data.\");");
            sb.AppendLine("                return Results.Ok(diagramData);");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private static string GetModelFilePath(string fullTypeName)");
            sb.AppendLine("        {");
            sb.AppendLine("            try");
            sb.AppendLine("            {");
            sb.AppendLine("                var entryAssembly = Assembly.GetEntryAssembly();");
            sb.AppendLine("                if (entryAssembly == null) return string.Empty;");
            sb.AppendLine();
            sb.AppendLine("                var type = entryAssembly.GetType(fullTypeName);");
            sb.AppendLine("                if (type == null)");
            sb.AppendLine("                {");
            sb.AppendLine("                    // Try to find in all loaded assemblies");
            sb.AppendLine("                    foreach (var assembly in System.AppDomain.CurrentDomain.GetAssemblies())");
            sb.AppendLine("                    {");
            sb.AppendLine("                        type = assembly.GetType(fullTypeName);");
            sb.AppendLine("                        if (type != null) break;");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine();
            sb.AppendLine("                if (type == null) return string.Empty;");
            sb.AppendLine();
            sb.AppendLine("                // Try to get source file path from debug symbols");
            sb.AppendLine("                var location = type.Assembly.Location;");
            sb.AppendLine("                if (string.IsNullOrEmpty(location)) return string.Empty;");
            sb.AppendLine();
            sb.AppendLine("                var assemblyDir = Path.GetDirectoryName(location);");
            sb.AppendLine("                if (string.IsNullOrEmpty(assemblyDir)) return string.Empty;");
            sb.AppendLine();
            sb.AppendLine("                // Try to find source file in common locations");
            sb.AppendLine("                var typeName = type.Name;");
            sb.AppendLine("                var possiblePaths = new[]");
            sb.AppendLine("                {");
            sb.AppendLine("                    Path.Combine(assemblyDir, \"..\", \"..\", \"..\", \"..\", \"Models\", $\"{typeName}.cs\"),");
            sb.AppendLine("                    Path.Combine(assemblyDir, \"..\", \"..\", \"..\", \"..\", \"..\", \"Models\", $\"{typeName}.cs\"),");
            sb.AppendLine("                    Path.Combine(assemblyDir, \"..\", \"..\", \"..\", \"Models\", $\"{typeName}.cs\"),");
            sb.AppendLine("                    Path.Combine(Directory.GetCurrentDirectory(), \"Models\", $\"{typeName}.cs\"),");
            sb.AppendLine("                    Path.Combine(Directory.GetCurrentDirectory(), \"src\", \"**\", \"Models\", $\"{typeName}.cs\")");
            sb.AppendLine("                };");
            sb.AppendLine();
            sb.AppendLine("                foreach (var path in possiblePaths)");
            sb.AppendLine("                {");
            sb.AppendLine("                    if (path.Contains(\"**\"))");
            sb.AppendLine("                    {");
            sb.AppendLine("                        var searchDir = Path.GetDirectoryName(path.Replace(\"**\", \"\"));");
            sb.AppendLine("                        if (Directory.Exists(searchDir))");
            sb.AppendLine("                        {");
            sb.AppendLine("                            var found = Directory.GetFiles(searchDir, $\"{typeName}.cs\", SearchOption.AllDirectories).FirstOrDefault();");
            sb.AppendLine("                            if (found != null)");
            sb.AppendLine("                            {");
            sb.AppendLine("                                return Path.GetRelativePath(Directory.GetCurrentDirectory(), found).Replace(Path.DirectorySeparatorChar, '/');");
            sb.AppendLine("                            }");
            sb.AppendLine("                        }");
            sb.AppendLine("                    }");
            sb.AppendLine("                    else if (File.Exists(path))");
            sb.AppendLine("                    {");
            sb.AppendLine("                        return Path.GetRelativePath(Directory.GetCurrentDirectory(), path).Replace(Path.DirectorySeparatorChar, '/');");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine();
            sb.AppendLine("                // Fallback: return namespace-based path");
            sb.AppendLine("                var namespaceParts = type.Namespace?.Split('.') ?? Array.Empty<string>();");
            sb.AppendLine("                if (namespaceParts.Length > 0)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var relativePath = string.Join(\"/\", namespaceParts.Skip(1).Concat(new[] { $\"{typeName}.cs\" }));");
            sb.AppendLine("                    return relativePath;");
            sb.AppendLine("                }");
            sb.AppendLine();
            sb.AppendLine("                return string.Empty;");
            sb.AppendLine("            }");
            sb.AppendLine("            catch");
            sb.AppendLine("            {");
            sb.AppendLine("                return string.Empty;");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class DiagramTableInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string Name { get; set; } = string.Empty;");
            sb.AppendLine("        public string FullName { get; set; } = string.Empty;");
            sb.AppendLine("        public string TableName { get; set; } = string.Empty;");
            sb.AppendLine("        public string DbContextName { get; set; } = string.Empty;");
            sb.AppendLine("        public string ModelFilePath { get; set; } = string.Empty;");
            sb.AppendLine("        public List<DiagramColumnInfo> Columns { get; set; } = new();");
            sb.AppendLine("        public List<DiagramRelationInfo> Relations { get; set; } = new();");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class DiagramColumnInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string Name { get; set; } = string.Empty;");
            sb.AppendLine("        public string Type { get; set; } = string.Empty;");
            sb.AppendLine("        public string FullType { get; set; } = string.Empty;");
            sb.AppendLine("        public bool IsNullable { get; set; }");
            sb.AppendLine("        public bool IsPrimaryKey { get; set; }");
            sb.AppendLine("        public bool IsForeignKey { get; set; }");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class DiagramRelationInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string FromTable { get; set; } = string.Empty;");
            sb.AppendLine("        public string ToTable { get; set; } = string.Empty;");
            sb.AppendLine("        public string FromColumn { get; set; } = string.Empty;");
            sb.AppendLine("        public string ToColumn { get; set; } = string.Empty;");
            sb.AppendLine("        public string RelationshipType { get; set; } = string.Empty;");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("DiagramEndpoints.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private void GenerateSqlExecutionEndpoints(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Builder;");
            sb.AppendLine("using Microsoft.AspNetCore.Http;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore;");
            sb.AppendLine("using Microsoft.Extensions.DependencyInjection;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Endpoints");
            sb.AppendLine("{");
            sb.AppendLine("    public static class SqlExecutionEndpoints");
            sb.AppendLine("    {");
            sb.AppendLine("        public static void MapSqlExecutionEndpoints(this WebApplication app)");
            sb.AppendLine("        {");
            sb.AppendLine("            var group = app.MapGroup(\"DBAdminPanel/api\");");
            sb.AppendLine();
            sb.AppendLine("            group.MapPost(\"sql/execute\", async (HttpContext context, IServiceProvider serviceProvider) =>");
            sb.AppendLine("            {");
            sb.AppendLine("                try");
            sb.AppendLine("                {");
            sb.AppendLine("                    using var streamReader = new System.IO.StreamReader(context.Request.Body);");
            sb.AppendLine("                    var body = await streamReader.ReadToEndAsync();");
            sb.AppendLine("                    var request = System.Text.Json.JsonSerializer.Deserialize<SqlExecutionRequest>(body, new System.Text.Json.JsonSerializerOptions");
            sb.AppendLine("                    {");
            sb.AppendLine("                        PropertyNameCaseInsensitive = true");
            sb.AppendLine("                    });");
            sb.AppendLine();
            sb.AppendLine("                    if (request == null || string.IsNullOrWhiteSpace(request.Sql))");
            sb.AppendLine("                    {");
            sb.AppendLine("                        return Results.BadRequest(new { message = \"SQL query is required\" });");
            sb.AppendLine("                    }");
            sb.AppendLine();
            sb.AppendLine("                    // Use a scope to get DbContext instances");
            sb.AppendLine("                    using var scope = serviceProvider.CreateScope();");
            sb.AppendLine("                    var scopedProvider = scope.ServiceProvider;");
            sb.AppendLine();
            sb.AppendLine("                    Microsoft.EntityFrameworkCore.DbContext? targetDbContext = null;");
            sb.AppendLine();
            sb.AppendLine("                    // Find DbContext by name if provided");
            sb.AppendLine("                    if (!string.IsNullOrWhiteSpace(request.DbContextName))");
            sb.AppendLine("                    {");
            
            // Generate code to find DbContext by name
            foreach (var (dbContext, entities) in allEntities)
            {
                var dbContextName = dbContext.Name;
                var dbContextFullName = dbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
                sb.AppendLine($"                        if (request.DbContextName == \"{dbContextName}\" || request.DbContextName == \"{dbContextName.Replace("DbContext", "")}\")");
                sb.AppendLine("                        {");
                sb.AppendLine($"                            targetDbContext = scopedProvider.GetService<{dbContextFullName}>();");
                sb.AppendLine("                            if (targetDbContext != null) goto FoundDbContext;");
                sb.AppendLine("                        }");
            }
            
            sb.AppendLine("                    }");
            sb.AppendLine();
            sb.AppendLine("                    // If no specific context requested or not found, get the first available DbContext");
            sb.AppendLine("                    if (targetDbContext == null)");
            sb.AppendLine("                    {");
            
            // Generate code to get first available DbContext
            var firstDbContext = allEntities.FirstOrDefault();
            if (firstDbContext.DbContext != null)
            {
                var dbContextFullName = firstDbContext.DbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
                sb.AppendLine($"                        targetDbContext = scopedProvider.GetService<{dbContextFullName}>();");
            }
            else
            {
                sb.AppendLine("                        // Try to get any DbContext from entry assembly");
                sb.AppendLine("                        var entryAssembly = Assembly.GetEntryAssembly();");
                sb.AppendLine("                        if (entryAssembly != null)");
                sb.AppendLine("                        {");
                sb.AppendLine("                            var dbContextTypes = entryAssembly.GetTypes()");
                sb.AppendLine("                                .Where(t => typeof(Microsoft.EntityFrameworkCore.DbContext).IsAssignableFrom(t) && !t.IsAbstract)");
                sb.AppendLine("                                .ToList();");
                sb.AppendLine();
                sb.AppendLine("                            foreach (var dbContextType in dbContextTypes)");
                sb.AppendLine("                            {");
                sb.AppendLine("                                try");
                sb.AppendLine("                                {");
                sb.AppendLine("                                    targetDbContext = scopedProvider.GetService(dbContextType) as Microsoft.EntityFrameworkCore.DbContext;");
                sb.AppendLine("                                    if (targetDbContext != null) break;");
                sb.AppendLine("                                }");
                sb.AppendLine("                                catch");
                sb.AppendLine("                                {");
                sb.AppendLine("                                    // Continue to next type");
                sb.AppendLine("                                }");
                sb.AppendLine("                            }");
                sb.AppendLine("                        }");
            }
            
            sb.AppendLine("                    }");
            sb.AppendLine();
            sb.AppendLine("                    FoundDbContext:");
            sb.AppendLine("                    if (targetDbContext == null)");
            sb.AppendLine("                    {");
            sb.AppendLine("                        return Results.BadRequest(new { message = \"No DbContext available\" });");
            sb.AppendLine("                    }");
            sb.AppendLine();
            sb.AppendLine("                    var startTime = System.Diagnostics.Stopwatch.StartNew();");
            sb.AppendLine("                    var sql = request.Sql.Trim();");
            sb.AppendLine();
            sb.AppendLine("                    // Check if query is a SELECT statement (returns results)");
            sb.AppendLine("                    var isSelectQuery = sql.TrimStart().StartsWith(\"SELECT\", System.StringComparison.OrdinalIgnoreCase) ||");
            sb.AppendLine("                                       sql.TrimStart().StartsWith(\"WITH\", System.StringComparison.OrdinalIgnoreCase) ||");
            sb.AppendLine("                                       sql.TrimStart().StartsWith(\"SHOW\", System.StringComparison.OrdinalIgnoreCase) ||");
            sb.AppendLine("                                       sql.TrimStart().StartsWith(\"DESCRIBE\", System.StringComparison.OrdinalIgnoreCase) ||");
            sb.AppendLine("                                       sql.TrimStart().StartsWith(\"EXPLAIN\", System.StringComparison.OrdinalIgnoreCase);");
            sb.AppendLine();
            sb.AppendLine("                    if (isSelectQuery)");
            sb.AppendLine("                    {");
            sb.AppendLine("                        // Execute query and return results");
            sb.AppendLine("                        using var command = targetDbContext.Database.GetDbConnection().CreateCommand();");
            sb.AppendLine("                        command.CommandText = sql;");
            sb.AppendLine("                        targetDbContext.Database.OpenConnection();");
            sb.AppendLine();
            sb.AppendLine("                        try");
            sb.AppendLine("                        {");
            sb.AppendLine("                            using var reader = await command.ExecuteReaderAsync();");
            sb.AppendLine("                            var columns = new System.Collections.Generic.List<string>();");
            sb.AppendLine("                            var rows = new System.Collections.Generic.List<object[]>();");
            sb.AppendLine();
            sb.AppendLine("                            // Get column names");
            sb.AppendLine("                            for (int i = 0; i < reader.FieldCount; i++)");
            sb.AppendLine("                            {");
            sb.AppendLine("                                columns.Add(reader.GetName(i));");
            sb.AppendLine("                            }");
            sb.AppendLine();
            sb.AppendLine("                            // Read rows");
            sb.AppendLine("                            while (await reader.ReadAsync())");
            sb.AppendLine("                            {");
            sb.AppendLine("                                var row = new object[reader.FieldCount];");
            sb.AppendLine("                                for (int i = 0; i < reader.FieldCount; i++)");
            sb.AppendLine("                                {");
            sb.AppendLine("                                    row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);");
            sb.AppendLine("                                }");
            sb.AppendLine("                                rows.Add(row);");
            sb.AppendLine("                            }");
            sb.AppendLine();
            sb.AppendLine("                            startTime.Stop();");
            sb.AppendLine();
            sb.AppendLine("                            return Results.Json(new");
            sb.AppendLine("                            {");
            sb.AppendLine("                                hasResult = true,");
            sb.AppendLine("                                columns = columns,");
            sb.AppendLine("                                rows = rows,");
            sb.AppendLine("                                rowCount = rows.Count,");
            sb.AppendLine("                                executionTime = startTime.ElapsedMilliseconds");
            sb.AppendLine("                            }, new System.Text.Json.JsonSerializerOptions");
            sb.AppendLine("                            {");
            sb.AppendLine("                                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase");
            sb.AppendLine("                            });");
            sb.AppendLine("                        }");
            sb.AppendLine("                        finally");
            sb.AppendLine("                        {");
            sb.AppendLine("                            targetDbContext.Database.CloseConnection();");
            sb.AppendLine("                        }");
            sb.AppendLine("                    }");
            sb.AppendLine("                    else");
            sb.AppendLine("                    {");
            sb.AppendLine("                        // Execute non-SELECT query (INSERT, UPDATE, DELETE, etc.)");
            sb.AppendLine("                        var rowsAffected = await targetDbContext.Database.ExecuteSqlRawAsync(sql);");
            sb.AppendLine("                        startTime.Stop();");
            sb.AppendLine();
            sb.AppendLine("                        return Results.Json(new");
            sb.AppendLine("                        {");
            sb.AppendLine("                            hasResult = false,");
            sb.AppendLine("                            rowsAffected = rowsAffected,");
            sb.AppendLine("                            executionTime = startTime.ElapsedMilliseconds");
            sb.AppendLine("                        }, new System.Text.Json.JsonSerializerOptions");
            sb.AppendLine("                        {");
            sb.AppendLine("                            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase");
            sb.AppendLine("                        });");
            sb.AppendLine("                    }");
            sb.AppendLine("                }");
            sb.AppendLine("                catch (System.Exception ex)");
            sb.AppendLine("                {");
            sb.AppendLine("                    return Results.Json(new { message = ex.Message, stackTrace = ex.StackTrace },");
            sb.AppendLine("                        statusCode: 500,");
            sb.AppendLine("                        options: new System.Text.Json.JsonSerializerOptions");
            sb.AppendLine("                        {");
            sb.AppendLine("                            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase");
            sb.AppendLine("                        });");
            sb.AppendLine("                }");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class SqlExecutionRequest");
            sb.AppendLine("        {");
            sb.AppendLine("            public string Sql { get; set; } = string.Empty;");
            sb.AppendLine("            public string? DbContextName { get; set; }");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("SqlExecutionEndpoints.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }
    }

}

