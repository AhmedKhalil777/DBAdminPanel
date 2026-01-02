# DBAdminPanel

A .NET source generator that automatically creates a complete MVC admin panel for Entity Framework Core models.

## Features

- **Automatic CRUD Generation**: Generates full Create, Read, Update, Delete operations for all entities
- **MVC Controllers**: Automatically generates controllers with all CRUD endpoints
- **Dashboard**: Provides a central dashboard to access all entity management pages
- **Route Configuration**: All admin panel routes are prefixed with `/DBAdminPanel`

## Installation

```bash
dotnet add package DBAdminPanel
```

## Usage

### 1. Add the Package

Add the `DBAdminPanel` NuGet package to your project that contains your `DbContext`.

### 2. Configure Services

In your `Program.cs` or `Startup.cs`, add the DBAdminPanel services:

```csharp
using DBAdminPanel;

var builder = WebApplication.CreateBuilder(args);

// Add your DbContext
builder.Services.AddDbContext<YourDbContext>(options =>
    options.UseSqlServer(connectionString));

// Add DBAdminPanel
builder.Services.AddDBAdminPanel();

var app = builder.Build();

// Use DBAdminPanel (optional, for additional middleware configuration)
app.UseDBAdminPanel();

app.Run();
```

### 3. Access the Admin Panel

Once configured, navigate to `/DBAdminPanel` to access the dashboard, which lists all entities in your `DbContext`.

Individual entity management pages are available at:
- `/DBAdminPanel/{EntityName}` - List all entities
- `/DBAdminPanel/{EntityName}/Create` - Create new entity
- `/DBAdminPanel/{EntityName}/Edit/{id}` - Edit entity
- `/DBAdminPanel/{EntityName}/Details/{id}` - View entity details
- `/DBAdminPanel/{EntityName}/Delete/{id}` - Delete entity

## How It Works

The source generator:
1. Scans your project for classes that inherit from `DbContext`
2. Identifies all `DbSet<T>` properties
3. Generates MVC controllers for each entity with full CRUD operations
4. Generates a dashboard controller
5. Provides service registration extensions

## Requirements

- .NET 6.0 or later
- Entity Framework Core
- ASP.NET Core MVC

## Notes

- The source generator automatically detects entities from your `DbContext`
- Key properties are automatically detected (properties named "Id" or "{EntityName}Id", or properties with `[Key]` attribute)
- All generated code is placed in the `DBAdminPanel.Generated` namespace

