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
                if (dbContextSymbol == null || !IsDbContext(dbContextSymbol, dbContextType)) continue;

                var entities = GetEntitiesFromDbContext(dbContextSymbol, dbContextType);
                if (entities.Any())
                {
                    allDbContextEntities.Add((dbContextSymbol, entities));
                }
            }

            if (!allDbContextEntities.Any()) return;

            GenerateJsonConverter(context);
            GenerateMetadataClasses(context, allDbContextEntities);
            GenerateEntityController(context, allDbContextEntities);
            GenerateMetadataController(context, allDbContextEntities);
            GenerateDashboardController(context, allDbContextEntities);
        }

        private void GenerateJsonConverter(GeneratorExecutionContext context)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using System.Text.Json;");
            sb.AppendLine("using System.Text.Json.Serialization;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Controllers");
            sb.AppendLine("{");
            sb.AppendLine("    public class StringToNumberConverter : JsonConverterFactory");
            sb.AppendLine("    {");
            sb.AppendLine("        public override bool CanConvert(Type typeToConvert)");
            sb.AppendLine("        {");
            sb.AppendLine("            return typeToConvert == typeof(decimal) || typeToConvert == typeof(decimal?) ||");
            sb.AppendLine("                   typeToConvert == typeof(double) || typeToConvert == typeof(double?) ||");
            sb.AppendLine("                   typeToConvert == typeof(float) || typeToConvert == typeof(float?) ||");
            sb.AppendLine("                   typeToConvert == typeof(int) || typeToConvert == typeof(int?) ||");
            sb.AppendLine("                   typeToConvert == typeof(long) || typeToConvert == typeof(long?);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("        {");
            sb.AppendLine("            if (typeToConvert == typeof(decimal) || typeToConvert == typeof(decimal?))");
            sb.AppendLine("                return new DecimalConverter();");
            sb.AppendLine("            if (typeToConvert == typeof(double) || typeToConvert == typeof(double?))");
            sb.AppendLine("                return new DoubleConverter();");
            sb.AppendLine("            if (typeToConvert == typeof(float) || typeToConvert == typeof(float?))");
            sb.AppendLine("                return new FloatConverter();");
            sb.AppendLine("            if (typeToConvert == typeof(int) || typeToConvert == typeof(int?))");
            sb.AppendLine("                return new IntConverter();");
            sb.AppendLine("            if (typeToConvert == typeof(long) || typeToConvert == typeof(long?))");
            sb.AppendLine("                return new LongConverter();");
            sb.AppendLine("            throw new NotSupportedException();");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class DecimalConverter : JsonConverter<decimal>");
            sb.AppendLine("        {");
            sb.AppendLine("            public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (reader.TokenType == JsonTokenType.String)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var str = reader.GetString();");
            sb.AppendLine("                    if (string.IsNullOrWhiteSpace(str)) return 0m;");
            sb.AppendLine("                    return decimal.Parse(str, System.Globalization.CultureInfo.InvariantCulture);");
            sb.AppendLine("                }");
            sb.AppendLine("                return reader.GetDecimal();");
            sb.AppendLine("            }");
            sb.AppendLine();
            sb.AppendLine("            public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                writer.WriteNumberValue(value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class DoubleConverter : JsonConverter<double>");
            sb.AppendLine("        {");
            sb.AppendLine("            public override double Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (reader.TokenType == JsonTokenType.String)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var str = reader.GetString();");
            sb.AppendLine("                    if (string.IsNullOrWhiteSpace(str)) return 0.0;");
            sb.AppendLine("                    return double.Parse(str, System.Globalization.CultureInfo.InvariantCulture);");
            sb.AppendLine("                }");
            sb.AppendLine("                return reader.GetDouble();");
            sb.AppendLine("            }");
            sb.AppendLine();
            sb.AppendLine("            public override void Write(Utf8JsonWriter writer, double value, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                writer.WriteNumberValue(value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class FloatConverter : JsonConverter<float>");
            sb.AppendLine("        {");
            sb.AppendLine("            public override float Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (reader.TokenType == JsonTokenType.String)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var str = reader.GetString();");
            sb.AppendLine("                    if (string.IsNullOrWhiteSpace(str)) return 0f;");
            sb.AppendLine("                    return float.Parse(str, System.Globalization.CultureInfo.InvariantCulture);");
            sb.AppendLine("                }");
            sb.AppendLine("                return reader.GetSingle();");
            sb.AppendLine("            }");
            sb.AppendLine();
            sb.AppendLine("            public override void Write(Utf8JsonWriter writer, float value, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                writer.WriteNumberValue(value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class IntConverter : JsonConverter<int>");
            sb.AppendLine("        {");
            sb.AppendLine("            public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (reader.TokenType == JsonTokenType.String)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var str = reader.GetString();");
            sb.AppendLine("                    if (string.IsNullOrWhiteSpace(str)) return 0;");
            sb.AppendLine("                    return int.Parse(str, System.Globalization.CultureInfo.InvariantCulture);");
            sb.AppendLine("                }");
            sb.AppendLine("                return reader.GetInt32();");
            sb.AppendLine("            }");
            sb.AppendLine();
            sb.AppendLine("            public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                writer.WriteNumberValue(value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private class LongConverter : JsonConverter<long>");
            sb.AppendLine("        {");
            sb.AppendLine("            public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                if (reader.TokenType == JsonTokenType.String)");
            sb.AppendLine("                {");
            sb.AppendLine("                    var str = reader.GetString();");
            sb.AppendLine("                    if (string.IsNullOrWhiteSpace(str)) return 0L;");
            sb.AppendLine("                    return long.Parse(str, System.Globalization.CultureInfo.InvariantCulture);");
            sb.AppendLine("                }");
            sb.AppendLine("                return reader.GetInt64();");
            sb.AppendLine("            }");
            sb.AppendLine();
            sb.AppendLine("            public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)");
            sb.AppendLine("            {");
            sb.AppendLine("                writer.WriteNumberValue(value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("StringToNumberConverter.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private bool IsDbContext(INamedTypeSymbol type, INamedTypeSymbol dbContextType)
        {
            var current = type;
            while (current != null)
            {
                if (SymbolEqualityComparer.Default.Equals(current, dbContextType))
                    return true;
                current = current.BaseType;
            }
            return false;
        }

        private List<EntityInfo> GetEntitiesFromDbContext(INamedTypeSymbol dbContext, INamedTypeSymbol dbContextType)
        {
            var entities = new List<EntityInfo>();
            var dbSetType = dbContextType.ContainingNamespace.GetMembers("DbSet").OfType<INamedTypeSymbol>()
                .FirstOrDefault()?.ConstructUnboundGenericType() ?? 
                dbContext.ContainingAssembly.GetTypeByMetadataName("Microsoft.EntityFrameworkCore.DbSet`1");

            foreach (var member in dbContext.GetMembers())
            {
                if (member is IPropertySymbol prop && prop.Type is INamedTypeSymbol namedType)
                {
                    if (namedType.IsGenericType)
                    {
                        var genericTypeDef = namedType.ConstructUnboundGenericType();
                        if (genericTypeDef.Name == "DbSet" && namedType.TypeArguments.Length == 1)
                        {
                            var entityType = namedType.TypeArguments[0] as INamedTypeSymbol;
                            if (entityType != null)
                            {
                                var keyProperty = FindKeyProperty(entityType);
                                entities.Add(new EntityInfo
                                {
                                    Name = entityType.Name,
                                    FullName = entityType.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                                    DbSetName = prop.Name,
                                    DbContextName = dbContext.Name,
                                    DbContextFullName = dbContext.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                                    KeyProperty = keyProperty?.Name ?? "Id",
                                    KeyPropertyType = keyProperty?.Type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) ?? "int",
                                    Properties = GetEntityProperties(entityType, keyProperty)
                                });
                            }
                        }
                    }
                }
            }
            return entities;
        }

        private IPropertySymbol? FindKeyProperty(INamedTypeSymbol entityType)
        {
            var properties = entityType.GetMembers().OfType<IPropertySymbol>();
            
            // Look for "Id" or "{EntityName}Id"
            var idProperty = properties.FirstOrDefault(p => 
                p.Name == "Id" || p.Name == $"{entityType.Name}Id");
            if (idProperty != null) return idProperty;

            // Look for [Key] attribute
            foreach (var prop in properties)
            {
                if (prop.GetAttributes().Any(a => a.AttributeClass?.Name == "KeyAttribute"))
                    return prop;
            }

            return properties.FirstOrDefault();
        }

        private List<PropertyInfo> GetEntityProperties(INamedTypeSymbol entityType, IPropertySymbol? keyProperty)
        {
            var properties = new List<PropertyInfo>();
            var keyPropertyName = keyProperty?.Name ?? "Id";

            foreach (var prop in entityType.GetMembers().OfType<IPropertySymbol>())
            {
                if (prop.IsStatic || prop.GetMethod == null) continue;
                
                properties.Add(new PropertyInfo
                {
                    Name = prop.Name,
                    Type = prop.Type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                    IsKey = prop.Name == keyPropertyName
                });
            }

            return properties;
        }

        private void GenerateMetadataClasses(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("#nullable enable");
            sb.AppendLine("using System.Collections.Generic;");
            sb.AppendLine("using System.Linq;");
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
                        var inputType = GetInputType(prop.Type);
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
            sb.AppendLine("}");

            context.AddSource("EntityMetadata.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private string GetInputType(string typeName)
        {
            var cleanType = typeName.TrimEnd('?').Split('.').Last();
            
            if (cleanType == "DateTime" || cleanType == "DateTimeOffset")
                return "datetime-local";
            if (cleanType == "DateOnly")
                return "date";
            if (cleanType == "TimeOnly")
                return "time";
            if (cleanType == "Boolean" || cleanType == "bool")
                return "checkbox";
            if (cleanType == "Int32" || cleanType == "Int64" || cleanType == "Int16" || cleanType == "Byte" ||
                cleanType == "int" || cleanType == "long" || cleanType == "short" || cleanType == "byte")
                return "number";
            if (cleanType == "Decimal" || cleanType == "Double" || cleanType == "Single" ||
                cleanType == "decimal" || cleanType == "double" || cleanType == "float")
                return "number";
            if (cleanType == "String" || cleanType == "string")
                return "text";
            if (cleanType == "Guid")
                return "text";

            return "text";
        }

        private void GenerateEntityController(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            // Generate one controller per entity
            foreach (var (dbContext, entities) in allEntities)
            {
                foreach (var entity in entities)
                {
                    GenerateSingleEntityController(context, entity, dbContext);
                }
            }
        }

        private void GenerateSingleEntityController(GeneratorExecutionContext context, EntityInfo entity, INamedTypeSymbol dbContext)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Mvc;");
            sb.AppendLine("using Microsoft.EntityFrameworkCore;");
            sb.AppendLine("using System.Text.Json;");
            sb.AppendLine("using System.Text.Json.Serialization;");
            sb.AppendLine("using System.Threading.Tasks;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Controllers");
            sb.AppendLine("{");
            sb.AppendLine($"    [Route(\"DBAdminPanel/{entity.Name}\")]");
            sb.AppendLine($"    public class {entity.Name}DBAdminPanelController : Controller");
            sb.AppendLine("    {");
            sb.AppendLine("        private readonly IServiceProvider _serviceProvider;");
            sb.AppendLine();
            sb.AppendLine($"        public {entity.Name}DBAdminPanelController(IServiceProvider serviceProvider)");
            sb.AppendLine("        {");
            sb.AppendLine("            _serviceProvider = serviceProvider;");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        private void NormalizeDateTimeProperties(object entity)");
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
            sb.AppendLine("        [HttpGet]");
            sb.AppendLine("        [HttpGet(\"Index\")]");
            sb.AppendLine("        public IActionResult Index()");
            sb.AppendLine("        {");
            sb.AppendLine($"            ViewData[\"EntityName\"] = \"{entity.Name}\";");
            sb.AppendLine("            return View();");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpGet(\"api\")]");
            sb.AppendLine($"        public async Task<IActionResult> GetAll()");
            sb.AppendLine("        {");
            sb.AppendLine($"            var dbContext = _serviceProvider.GetService(typeof({entity.DbContextFullName})) as {entity.DbContextFullName};");
            sb.AppendLine("            if (dbContext == null) return NotFound();");
            sb.AppendLine($"            var entities = await dbContext.{entity.DbSetName}.ToListAsync();");
            sb.AppendLine("            return Json(entities);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpGet(\"api/{id}\")]");
            sb.AppendLine($"        public async Task<IActionResult> GetById(string id)");
            sb.AppendLine("        {");
            sb.AppendLine($"            var dbContext = _serviceProvider.GetService(typeof({entity.DbContextFullName})) as {entity.DbContextFullName};");
            sb.AppendLine("            if (dbContext == null) return NotFound();");
            
            // Parse key based on type
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = int.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = long.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("            var key = System.Guid.Parse(id);");
            }
            else
            {
                sb.AppendLine($"            var key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
            }
            
            sb.AppendLine($"            var entity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("            if (entity == null) return NotFound();");
            sb.AppendLine("            return Json(entity);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpPost(\"api\")]");
            sb.AppendLine($"        public async Task<IActionResult> Create([FromBody] JsonElement data)");
            sb.AppendLine("        {");
            sb.AppendLine($"            var dbContext = _serviceProvider.GetService(typeof({entity.DbContextFullName})) as {entity.DbContextFullName};");
            sb.AppendLine("            if (dbContext == null) return NotFound();");
            sb.AppendLine("            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };");
            sb.AppendLine("            options.Converters.Add(new StringToNumberConverter());");
            sb.AppendLine($"            var entity = JsonSerializer.Deserialize<{entity.FullName}>(data.GetRawText(), options);");
            sb.AppendLine("            if (entity == null) return BadRequest();");
            sb.AppendLine("            NormalizeDateTimeProperties(entity);");
            sb.AppendLine($"            dbContext.{entity.DbSetName}.Add(entity);");
            sb.AppendLine("            await dbContext.SaveChangesAsync();");
            sb.AppendLine("            return Ok(entity);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpPut(\"api/{id}\")]");
            sb.AppendLine($"        public async Task<IActionResult> Update(string id, [FromBody] JsonElement data)");
            sb.AppendLine("        {");
            sb.AppendLine($"            var dbContext = _serviceProvider.GetService(typeof({entity.DbContextFullName})) as {entity.DbContextFullName};");
            sb.AppendLine("            if (dbContext == null) return NotFound();");
            
            // Parse key
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = int.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = long.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("            var key = System.Guid.Parse(id);");
            }
            else
            {
                sb.AppendLine($"            var key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
            }
            
            sb.AppendLine($"            var existingEntity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("            if (existingEntity == null) return NotFound();");
            sb.AppendLine("            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };");
            sb.AppendLine("            options.Converters.Add(new StringToNumberConverter());");
            sb.AppendLine($"            var updatedEntity = JsonSerializer.Deserialize<{entity.FullName}>(data.GetRawText(), options);");
            sb.AppendLine("            if (updatedEntity == null) return BadRequest();");
            sb.AppendLine("            NormalizeDateTimeProperties(updatedEntity);");
            sb.AppendLine("            dbContext.Entry(existingEntity).CurrentValues.SetValues(updatedEntity);");
            sb.AppendLine("            await dbContext.SaveChangesAsync();");
            sb.AppendLine("            return Ok(existingEntity);");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpDelete(\"api/{id}\")]");
            sb.AppendLine($"        public async Task<IActionResult> Delete(string id)");
            sb.AppendLine("        {");
            sb.AppendLine($"            var dbContext = _serviceProvider.GetService(typeof({entity.DbContextFullName})) as {entity.DbContextFullName};");
            sb.AppendLine("            if (dbContext == null) return NotFound();");
            
            // Parse key
            if (entity.KeyPropertyType.Contains("int") && !entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = int.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("long"))
            {
                sb.AppendLine("            var key = long.Parse(id);");
            }
            else if (entity.KeyPropertyType.Contains("Guid"))
            {
                sb.AppendLine("            var key = System.Guid.Parse(id);");
            }
            else
            {
                sb.AppendLine($"            var key = System.Convert.ChangeType(id, typeof({entity.KeyPropertyType}));");
            }
            
            sb.AppendLine($"            var entity = await dbContext.{entity.DbSetName}.FindAsync(key);");
            sb.AppendLine("            if (entity == null) return NotFound();");
            sb.AppendLine($"            dbContext.{entity.DbSetName}.Remove(entity);");
            sb.AppendLine("            await dbContext.SaveChangesAsync();");
            sb.AppendLine("            return Ok();");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource($"{entity.Name}DBAdminPanelController.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }


        private void GenerateMetadataController(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Mvc;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using DBAdminPanel.Generated;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Controllers");
            sb.AppendLine("{");
            sb.AppendLine("    [Route(\"DBAdminPanel/api\")]");
            sb.AppendLine("    [ApiController]");
            sb.AppendLine("    public class MetaDataController : ControllerBase");
            sb.AppendLine("    {");
            sb.AppendLine("        [HttpGet(\"metadata\")]");
            sb.AppendLine("        [HttpGet(\"entities\")]");
            sb.AppendLine("        public IActionResult GetAllMetadata()");
            sb.AppendLine("        {");
            sb.AppendLine("            var entities = EntityMetadata.GetAllEntities();");
            sb.AppendLine("            return Ok(entities.Select(e => new");
            sb.AppendLine("            {");
            sb.AppendLine("                name = e.Name,");
            sb.AppendLine("                fullName = e.FullName,");
            sb.AppendLine("                dbSetName = e.DbSetName,");
            sb.AppendLine("                keyProperty = e.KeyProperty,");
            sb.AppendLine("                dbContextName = e.DbContextName,");
            sb.AppendLine("                dbContextFullName = e.DbContextFullName,");
            sb.AppendLine("                properties = e.Properties,");
            sb.AppendLine("                apiEndpoints = e.ApiEndpoints");
            sb.AppendLine("            }));");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpGet(\"metadata/{entityName}\")]");
            sb.AppendLine("        [HttpGet(\"entities/{entityName}/metadata\")]");
            sb.AppendLine("        public IActionResult GetEntityMetadata(string entityName)");
            sb.AppendLine("        {");
            sb.AppendLine("            var metadata = EntityMetadata.GetEntityMetadata(entityName);");
            sb.AppendLine("            if (metadata == null) return NotFound();");
            sb.AppendLine("            return Ok(new");
            sb.AppendLine("            {");
            sb.AppendLine("                name = metadata.Name,");
            sb.AppendLine("                fullName = metadata.FullName,");
            sb.AppendLine("                dbSetName = metadata.DbSetName,");
            sb.AppendLine("                keyProperty = metadata.KeyProperty,");
            sb.AppendLine("                dbContextName = metadata.DbContextName,");
            sb.AppendLine("                dbContextFullName = metadata.DbContextFullName,");
            sb.AppendLine("                properties = metadata.Properties,");
            sb.AppendLine("                apiEndpoints = metadata.ApiEndpoints");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("MetadataController.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }

        private void GenerateDashboardController(GeneratorExecutionContext context, List<(INamedTypeSymbol DbContext, List<EntityInfo> Entities)> allEntities)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using Microsoft.AspNetCore.Mvc;");
            sb.AppendLine("using DBAdminPanel.Generated;");
            sb.AppendLine();
            sb.AppendLine("namespace DBAdminPanel.Generated.Controllers");
            sb.AppendLine("{");
            sb.AppendLine("    [Route(\"DBAdminPanel\")]");
            sb.AppendLine("    public class DashboardController : Controller");
            sb.AppendLine("    {");
            sb.AppendLine("        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _env;");
            sb.AppendLine();
            sb.AppendLine("        public DashboardController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)");
            sb.AppendLine("        {");
            sb.AppendLine("            _env = env;");
            sb.AppendLine("        }");
            sb.AppendLine();
            sb.AppendLine("        [HttpGet]");
            sb.AppendLine("        [HttpGet(\"Index\")]");
            sb.AppendLine("        public IActionResult Index()");
            sb.AppendLine("        {");
            sb.AppendLine("            var webRootPath = _env.WebRootPath ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), \"wwwroot\");");
            sb.AppendLine("            // Files are copied to wwwroot root during build (from browser subdirectory)");
            sb.AppendLine("            var indexPath = System.IO.Path.Combine(webRootPath, \"index.html\");");
            sb.AppendLine("            if (System.IO.File.Exists(indexPath))");
            sb.AppendLine("            {");
            sb.AppendLine("                return PhysicalFile(indexPath, \"text/html\");");
            sb.AppendLine("            }");
            sb.AppendLine("            return NotFound(\"Angular app not found. Please build the Angular application.\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("}");

            context.AddSource("DashboardController.g.cs", SourceText.From(sb.ToString(), Encoding.UTF8));
        }
    }

    internal class DbContextSyntaxReceiver : ISyntaxReceiver
    {
        public List<ClassDeclarationSyntax> DbContextCandidates { get; } = new();

        public void OnVisitSyntaxNode(SyntaxNode syntaxNode)
        {
            if (syntaxNode is ClassDeclarationSyntax classDeclaration)
            {
                DbContextCandidates.Add(classDeclaration);
            }
        }
    }

    internal class EntityInfo
    {
        public string Name { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string DbSetName { get; set; } = string.Empty;
        public string DbContextName { get; set; } = string.Empty;
        public string DbContextFullName { get; set; } = string.Empty;
        public string KeyProperty { get; set; } = string.Empty;
        public string KeyPropertyType { get; set; } = string.Empty;
        public List<PropertyInfo> Properties { get; set; } = new();
    }

    internal class PropertyInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsKey { get; set; }
    }
}

