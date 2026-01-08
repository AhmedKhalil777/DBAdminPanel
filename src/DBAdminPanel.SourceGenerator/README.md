# DBAdminPanel.SourceGenerator

<div align="center">
  <img src="logo.svg" alt="DBAdminPanel SourceGenerator Logo" width="128" height="128">
  
  **Source generator for DBAdminPanel that automatically generates controllers, endpoints, and metadata classes from Entity Framework Core models.**
  
</div>

## 📦 About This Package

This is the **source generator** component of DBAdminPanel. It automatically generates code at compile time to create:

- **MVC Controllers** with full CRUD operations
- **REST API Endpoints** for programmatic access
- **Metadata Classes** for entity information
- **Dashboard Endpoints** for the admin panel UI
- **Entity Relationship Diagrams** using Mermaid

## ⚠️ Important Note

**You typically don't need to install this package directly!**

The `DBAdminPanel` package automatically includes this source generator as a dependency. Only install this package separately if you need to:

- Use the source generator without the UI components
- Customize the source generation behavior
- Develop extensions for DBAdminPanel

## 📦 Installation

If you need to install this package separately:

```bash
dotnet add package DBAdminPanel.SourceGenerator
```

Or via Package Manager Console:

```powershell
Install-Package DBAdminPanel.SourceGenerator
```

## 🎯 How It Works

The source generator:

1. **Scans** your project for `DbContext` classes
2. **Identifies** all `DbSet<T>` properties
3. **Analyzes** entity properties, relationships, and keys
4. **Generates** code at compile time (zero runtime overhead)
5. **Places** all generated code in the `DBAdminPanel.Generated` namespace

## 🔍 Generated Code

### Controllers

For each entity in your `DbContext`, the generator creates:

```csharp
namespace DBAdminPanel.Generated.Controllers
{
    public partial class {EntityName}Controller : Controller
    {
        // Full CRUD operations
        // Index, Create, Edit, Details, Delete actions
    }
}
```

### API Endpoints

REST API endpoints are generated using minimal APIs:

```csharp
namespace DBAdminPanel.Generated.Endpoints
{
    public static class EntityEndpoints
    {
        public static void MapAllEntityEndpoints(WebApplication app)
        {
            // GET, POST, PUT, DELETE endpoints for all entities
        }
    }
}
```

### Metadata Classes

Entity metadata is generated for UI generation:

```csharp
namespace DBAdminPanel.Generated.Metadata
{
    public class {EntityName}Metadata
    {
        // Property information
        // Validation rules
        // Relationships
        // Display names
    }
}
```

## 📋 Requirements

- **.NET Standard 2.0** compatible (works with .NET 8.0, 9.0, 10.0+)
- **Microsoft.CodeAnalysis.CSharp** 4.12.0+
- **Entity Framework Core** (in the consuming project)

## 🔧 Configuration

The source generator works automatically - no configuration needed! It will:

- Detect all `DbContext` classes in your project
- Find all `DbSet<T>` properties
- Generate controllers and endpoints automatically
- Work with any EF Core provider (SQL Server, PostgreSQL, SQLite, etc.)

## 🎨 Customization

To customize the generated code, you can:

1. **Extend Generated Controllers**: Use partial classes to add custom logic
2. **Override Endpoints**: Map your own endpoints after calling `UseDBAdminPanel()`
3. **Custom Metadata**: Extend metadata classes for additional information

## 📝 Example

When you have a `DbContext` like this:

```csharp
public class BlogDbContext : DbContext
{
    public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options) { }
    
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<Category> Categories { get; set; }
}
```

The source generator automatically creates:

- `BlogPostController` with CRUD actions
- `CategoryController` with CRUD actions
- API endpoints for both entities
- Metadata classes for both entities
- Dashboard endpoints listing all entities

## 🔍 Viewing Generated Code

To see the generated code:

1. Build your project
2. Navigate to: `obj/Debug/netX.X/generated/`
3. Look for files in the `DBAdminPanel.Generated` namespace

Or use Visual Studio's "Show All Files" to view generated files.

## 🐛 Troubleshooting

### Generated code not appearing

- Ensure your project references this package
- Rebuild your solution (Clean + Build)
- Check that your `DbContext` classes are public and accessible
- Verify `DbSet<T>` properties are public

### IntelliSense not working

- Restart your IDE
- Rebuild the solution
- Clear the `obj` and `bin` folders and rebuild

### Compilation errors

- Check that your entity classes are properly defined
- Ensure primary keys are correctly identified
- Verify Entity Framework Core is properly configured

## 📚 Related Packages

- **[DBAdminPanel](https://www.nuget.org/packages/DBAdminPanel)** - Main package (includes this source generator)
- **[Entity Framework Core](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore)** - Required in your project

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ahmedkhalil777/DBAdminPanel/blob/main/LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/ahmedkhalil777/DBAdminPanel/issues) page
2. Create a new issue with detailed information
3. Join our discussions

## 🙏 Acknowledgments

- Built with [.NET Source Generators](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/source-generators-overview)
- Uses [Microsoft.CodeAnalysis.CSharp](https://www.nuget.org/packages/Microsoft.CodeAnalysis.CSharp)

---

<div align="center">
  Made with ❤️ by the DBAdminPanel team
  
  [⭐ Star us on GitHub](https://github.com/ahmedkhalil777/DBAdminPanel) | [📦 NuGet Package](https://www.nuget.org/packages/DBAdminPanel.SourceGenerator)
</div>

