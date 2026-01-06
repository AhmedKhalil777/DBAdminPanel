using System.Collections.Generic;

namespace DBAdminPanel.SourceGenerator
{
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
}

