using Microsoft.CodeAnalysis;
using System.Collections.Generic;
using System.Linq;

namespace DBAdminPanel.SourceGenerator
{
    internal static class EntityAnalyzer
    {
        public static bool IsDbContext(INamedTypeSymbol type, INamedTypeSymbol dbContextType)
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

        public static List<EntityInfo> GetEntitiesFromDbContext(INamedTypeSymbol dbContext, INamedTypeSymbol dbContextType)
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

        public static IPropertySymbol? FindKeyProperty(INamedTypeSymbol entityType)
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

        public static List<PropertyInfo> GetEntityProperties(INamedTypeSymbol entityType, IPropertySymbol? keyProperty)
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
    }
}

