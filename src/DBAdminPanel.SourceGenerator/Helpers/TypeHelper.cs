using System.Linq;

namespace DBAdminPanel.SourceGenerator
{
    internal static class TypeHelper
    {
        public static string GetInputType(string typeName)
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
    }
}


