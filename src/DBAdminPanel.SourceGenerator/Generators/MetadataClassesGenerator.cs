using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Generic;
using System.Text;

namespace DBAdminPanel.SourceGenerator.Generators
{
    internal static class MetadataClassesGenerator
    {
        public static void Generate(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("#nullable enable");
            sb.AppendLine("using System.Collections.Generic;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore.Metadata;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated");
            sb.AppendLine("{");
            sb.AppendLine("    public static class EntityMetadata");
            sb.AppendLine("    {");
            sb.AppendLine("        public static List<EntityMetadataInfo> GetAllEntities()");
            sb.AppendLine("        {");
            sb.AppendLine("            return new List<EntityMetadataInfo>");
            sb.AppendLine("            {");

            foreach (var (dbContext, entities) in allEntities)
            {
                foreach (var entity in entities)
                {
                    sb.AppendLine($"                new EntityMetadataInfo");
                    sb.AppendLine("                {");
                    sb.AppendLine($"                    Name = \"{entity.Name}\",");
                    sb.AppendLine($"                    FullName = \"{entity.FullName}\",");
                    sb.AppendLine($"                    DbSetName = \"{entity.DbSetName}\",");
                    sb.AppendLine($"                    KeyProperty = \"{entity.KeyProperty}\",");
                    sb.AppendLine($"                    DbContextName = \"{entity.DbContextName}\",");
                    sb.AppendLine($"                    DbContextFullName = \"{entity.DbContextFullName}\",");
                    sb.AppendLine($"                    Properties = new List<PropertyMetadataInfo>");
                    sb.AppendLine("                    {");
                    foreach (var prop in entity.Properties)
                    {
                        var inputType = TypeHelper.GetInputType(prop.Type);
                        sb.AppendLine($"                        new PropertyMetadataInfo");
                        sb.AppendLine("                        {");
                        sb.AppendLine($"                            Name = \"{prop.Name}\",");
                        sb.AppendLine($"                            Type = \"{prop.Type}\",");
                        sb.AppendLine($"                            InputType = \"{inputType}\",");
                        sb.AppendLine($"                            IsKey = {prop.IsKey.ToString().ToLowerInvariant()}");
                        sb.AppendLine("                        },");
                    }
                    // Remove trailing comma
                    var content = sb.ToString().TrimEnd();
                    if (content.EndsWith(","))
                    {
                        sb.Clear();
                        sb.Append(content.Substring(0, content.Length - 1));
                    }
                    sb.AppendLine();
                    sb.AppendLine("                    },");
                    sb.AppendLine($"                    ApiEndpoints = new List<ApiEndpointInfo>");
                    sb.AppendLine("                    {");
                    sb.AppendLine($"                        new ApiEndpointInfo {{ Method = \"GET\", Path = \"/DBAdminPanel/{entity.Name}/api\", Description = \"Get all {entity.Name} entities\" }},");
                    sb.AppendLine($"                        new ApiEndpointInfo {{ Method = \"GET\", Path = \"/DBAdminPanel/{entity.Name}/api/{{id}}\", Description = \"Get {entity.Name} entity by ID\" }},");
                    sb.AppendLine($"                        new ApiEndpointInfo {{ Method = \"POST\", Path = \"/DBAdminPanel/{entity.Name}/api\", Description = \"Create new {entity.Name} entity\" }},");
                    sb.AppendLine($"                        new ApiEndpointInfo {{ Method = \"PUT\", Path = \"/DBAdminPanel/{entity.Name}/api/{{id}}\", Description = \"Update {entity.Name} entity\" }},");
                    sb.AppendLine($"                        new ApiEndpointInfo {{ Method = \"DELETE\", Path = \"/DBAdminPanel/{entity.Name}/api/{{id}}\", Description = \"Delete {entity.Name} entity\" }}");
                    sb.AppendLine("                    }");
                    sb.AppendLine("                },");
                }
            }

            // Remove trailing comma
            var finalContent = sb.ToString().TrimEnd();
            if (finalContent.EndsWith(","))
            {
                sb.Clear();
                sb.Append(finalContent.Substring(0, finalContent.Length - 1));
            }
            sb.AppendLine();
            sb.AppendLine("            };");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        public static EntityMetadataInfo? GetEntityMetadata(string entityName)");
            sb.AppendLine("        {");
            sb.AppendLine("            return GetAllEntities().FirstOrDefault(e => e.Name == entityName);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        public static (string DbContextFullName, string DbSetName)? GetDbContextAndSet(string entityName)");
            sb.AppendLine("        {");
            foreach (var (dbContext, entities) in allEntities)
            {
                foreach (var entity in entities)
                {
                    sb.AppendLine($"            if (entityName == \"{entity.Name}\")");
                    sb.AppendLine("            {");
                    sb.AppendLine($"                return (\"{entity.DbContextFullName}\", \"{entity.DbSetName}\");");
                    sb.AppendLine("            }");
                }
            }
            sb.AppendLine("            return null;");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class EntityMetadataInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string Name { get; set; } = string.Empty;");
            sb.AppendLine("        public string FullName { get; set; } = string.Empty;");
            sb.AppendLine("        public string DbSetName { get; set; } = string.Empty;");
            sb.AppendLine("        public string KeyProperty { get; set; } = string.Empty;");
            sb.AppendLine("        public string DbContextName { get; set; } = string.Empty;");
            sb.AppendLine("        public string DbContextFullName { get; set; } = string.Empty;");
            sb.AppendLine("        public string? DatabaseType { get; set; }");
            sb.AppendLine("        public List<PropertyMetadataInfo> Properties { get; set; } = new();");
            sb.AppendLine("        public List<ApiEndpointInfo> ApiEndpoints { get; set; } = new();");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class PropertyMetadataInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string Name { get; set; } = string.Empty;");
            sb.AppendLine("        public string Type { get; set; } = string.Empty;");
            sb.AppendLine("        public string InputType { get; set; } = string.Empty;");
            sb.AppendLine("        public bool IsKey { get; set; }");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public class ApiEndpointInfo");
            sb.AppendLine("    {");
            sb.AppendLine("        public string Method { get; set; } = string.Empty;");
            sb.AppendLine("        public string Path { get; set; } = string.Empty;");
            sb.AppendLine("        public string Description { get; set; } = string.Empty;");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    public static class DatabaseTypeDetector");
            sb.AppendLine("    {");
            sb.AppendLine("        public static string GetDatabaseType(Microsoft.EntityFrameworkCore.DbContext? dbContext)");
            sb.AppendLine("        {");
            sb.AppendLine("            if (dbContext == null) return \"PostgreSQL\"; // Default to PostgreSQL");
            sb.AppendLine("            var providerName = dbContext.Database.ProviderName ?? \"\";");
            sb.AppendLine("            if (providerName.Contains(\"PostgreSql\", System.StringComparison.OrdinalIgnoreCase)) return \"PostgreSQL\";");
            sb.AppendLine("            if (providerName.Contains(\"SqlServer\", System.StringComparison.OrdinalIgnoreCase)) return \"SQL Server\";");
            sb.AppendLine("            if (providerName.Contains(\"MySql\", System.StringComparison.OrdinalIgnoreCase)) return \"MySQL\";");
            sb.AppendLine("            if (providerName.Contains(\"Sqlite\", System.StringComparison.OrdinalIgnoreCase)) return \"SQLite\";");
            sb.AppendLine("            if (providerName.Contains(\"Oracle\", System.StringComparison.OrdinalIgnoreCase)) return \"Oracle\";");
            sb.AppendLine("            return \"PostgreSQL\"; // Default to PostgreSQL");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("EntityMetadata.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }
    }
}

