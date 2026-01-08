using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Generic;
using System.Text;

namespace DBAdminPanel.SourceGenerator.Generators
{
    internal static class EntityEndpointsGenerator
    {
        public static void Generate(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
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

        private static void GenerateSingleEntityEndpoints(StringBuilder sb, EntityInfo entity)
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
    }
}


