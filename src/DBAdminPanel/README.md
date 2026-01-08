# DBAdminPanel

<div align="center">
  <img src="logo.svg" alt="DBAdminPanel Logo" width="128" height="128">
  
  **A .NET source generator that automatically creates a complete MVC admin panel for Entity Framework Core models.**
</div>

## 🚀 Features

- **✨ Automatic CRUD Generation**: Generates full Create, Read, Update, Delete operations for all entities
- **🎨 Modern Angular UI**: Beautiful, responsive admin panel built with Angular 19 and Material Design
- **🔍 Smart Entity Detection**: Automatically scans your `DbContext` and generates controllers for all entities
- **📊 Dashboard**: Central dashboard to access all entity management pages
- **🔗 RESTful API**: Full REST API endpoints for all CRUD operations
- **📝 Metadata API**: Automatic metadata generation for entity properties, relationships, and validation
- **🗺️ Entity Relationship Diagrams**: Visual representation of your database schema using Mermaid
- **⚡ Source Generator**: Zero runtime overhead - all code generated at compile time
- **🎯 Type-Safe**: Fully typed with IntelliSense support
- **🔒 Extensible**: Easy to customize and extend

## 📦 Installation

Install the package via NuGet Package Manager:

```bash
dotnet add package DBAdminPanel
```

Or via Package Manager Console:

```powershell
Install-Package DBAdminPanel
```

Or add directly to your `.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="DBAdminPanel" Version="1.0.0" />
</ItemGroup>
```

## 🎯 Quick Start

### 1. Add the Package

Add the `DBAdminPanel` NuGet package to your ASP.NET Core project that contains your `DbContext`.

### 2. Configure Services

In your `Program.cs`, add the DBAdminPanel services:

```csharp
using DBAdminPanel;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add your DbContext
builder.Services.AddDbContext<YourDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add DBAdminPanel
builder.Services.AddDBAdminPanel();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseRouting();
app.UseAuthorization();

// Use DBAdminPanel (maps routes and static files)
app.UseDBAdminPanel();

app.MapControllers();
app.Run();
```

### 3. Mark Your DbContext

The source generator automatically detects `DbContext` classes. No additional attributes needed! Just ensure your `DbContext` is accessible:

```csharp
public class BlogDbContext : DbContext
{
    public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options) { }
    
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<Category> Categories { get; set; }
}
```

### 4. Access the Admin Panel

Once configured, navigate to `/DBAdminPanel` to access the dashboard, which lists all entities in your `DbContext`.

## 📚 Usage

### Entity Management

Individual entity management pages are available at:
- `/DBAdminPanel` - Dashboard with all entities
- `/DBAdminPanel/{EntityName}` - List all entities (with pagination, sorting, filtering)
- `/DBAdminPanel/{EntityName}/Create` - Create new entity
- `/DBAdminPanel/{EntityName}/Edit/{id}` - Edit entity
- `/DBAdminPanel/{EntityName}/Details/{id}` - View entity details
- `/DBAdminPanel/{EntityName}/Delete/{id}` - Delete entity

### API Endpoints

The source generator also creates REST API endpoints:

- `GET /api/DBAdminPanel/{EntityName}` - Get all entities (with pagination)
- `GET /api/DBAdminPanel/{EntityName}/{id}` - Get entity by ID
- `POST /api/DBAdminPanel/{EntityName}` - Create entity
- `PUT /api/DBAdminPanel/{EntityName}/{id}` - Update entity
- `DELETE /api/DBAdminPanel/{EntityName}/{id}` - Delete entity
- `GET /api/DBAdminPanel/{EntityName}/metadata` - Get entity metadata

### Metadata API

Get detailed metadata about your entities:

```bash
GET /api/DBAdminPanel/{EntityName}/metadata
```

Returns information about:
- Property types and names
- Required fields
- Navigation properties
- Foreign key relationships
- Display names and descriptions

### Entity Relationship Diagrams

View visual diagrams of your database schema:

```
GET /DBAdminPanel/diagram/{EntityName}
```

Diagrams are generated using Mermaid and show:
- Entity relationships
- Foreign key connections
- Property types

## 🏗️ How It Works

The source generator:

1. **Scans** your project for classes that inherit from `DbContext`
2. **Identifies** all `DbSet<T>` properties
3. **Analyzes** entity properties, relationships, and keys
4. **Generates** MVC controllers for each entity with full CRUD operations
5. **Creates** API endpoints for programmatic access
6. **Builds** metadata classes for UI generation
7. **Provides** service registration extensions

All generated code is placed in the `DBAdminPanel.Generated` namespace and is available at compile time.

## 🔧 Configuration

### Custom Route Prefix

By default, all routes are prefixed with `/DBAdminPanel`. You can customize this in your `Program.cs`:

```csharp
app.UseDBAdminPanel(); // Uses default /DBAdminPanel prefix
```

### Multiple DbContext Support

DBAdminPanel automatically detects and generates controllers for all `DbContext` classes in your project:

```csharp
// All DbContexts are automatically detected
builder.Services.AddDbContext<BlogDbContext>(...);
builder.Services.AddDbContext<UserDbContext>(...);
builder.Services.AddDbContext<ProductDbContext>(...);

// All entities from all contexts appear in the dashboard
builder.Services.AddDBAdminPanel();
```

### Entity Key Detection

The source generator automatically detects primary keys using:
1. Properties named `Id`
2. Properties named `{EntityName}Id`
3. Properties with `[Key]` attribute
4. Composite keys (multiple properties with `[Key]` attribute)

## 📋 Requirements

- **.NET 8.0**, **.NET 9.0**, or **.NET 10.0**
- **Entity Framework Core 8.0+** (matching your .NET version)
- **ASP.NET Core MVC** (included in .NET)
- **Node.js 20.x** (only required for building the package, not for using it)

## 🎨 UI Features

The Angular-based admin panel includes:

- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔍 Advanced Filtering**: Filter entities by any property
- **📊 Sorting**: Sort by any column
- **📄 Pagination**: Efficient pagination for large datasets
- **✨ Material Design**: Modern UI using Angular Material
- **🎯 Form Validation**: Client-side and server-side validation
- **🔄 Real-time Updates**: Instant feedback on operations
- **🌐 Internationalization Ready**: Easy to localize

## 🧪 Sample Application

See the [sample application](https://github.com/ahmedkhalil777/DBAdminPanel/tree/main/src/DBAdminPanel.Sample) for a complete working example with:
- Multiple `DbContext` classes
- Various entity types
- PostgreSQL integration
- .NET Aspire setup

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ahmedkhalil777/DBAdminPanel/blob/main/LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📖 Documentation

- [Main Repository README](https://github.com/ahmedkhalil777/DBAdminPanel)
- [Sample Application](https://github.com/ahmedkhalil777/DBAdminPanel/tree/main/src/DBAdminPanel.Sample)

## 💬 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/ahmedkhalil777/DBAdminPanel/issues) page
2. Create a new issue with detailed information
3. Join our discussions

## 🙏 Acknowledgments

- Built with [.NET Source Generators](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/source-generators-overview)
- UI powered by [Angular](https://angular.io/) and [Angular Material](https://material.angular.io/)
- Diagrams generated with [Mermaid](https://mermaid.js.org/)

---

<div align="center">
  Made with ❤️ by the DBAdminPanel team
  
  [⭐ Star us on GitHub](https://github.com/ahmedkhalil777/DBAdminPanel) | [📦 NuGet Package](https://www.nuget.org/packages/DBAdminPanel)
</div>
