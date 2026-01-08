# DBAdminPanel Sample Application

This sample application demonstrates how to use the DBAdminPanel source generator with multiple DbContext models, PostgreSQL, and .NET Aspire.

## 🎯 Overview

This sample showcases:
- **9 Different DbContext Models** with various entity types
- **PostgreSQL Integration** with separate databases per context
- **.NET Aspire Integration** for orchestration and observability
- **Auto-Generated Admin Panel** with full CRUD operations
- **Modern Angular UI** with Material Design

## 🚀 Quick Start

### Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20.x](https://nodejs.org/) (for building the package)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL via Aspire)

### Running the Application

1. **Clone and Navigate**:
   ```bash
   git clone https://github.com/ahmedkhalil777/DBAdminPanel.git
   cd DBAdminPanel/src/DBAdminPanel.AppHost
   ```

2. **Run the Aspire AppHost**:
   ```bash
   dotnet run
   ```
   
   This will:
   - Start the Aspire dashboard
   - Provision PostgreSQL containers
   - Start the sample application
   - Display all service URLs

3. **Access the Admin Panel**:
   - Navigate to `https://localhost:XXXX/DBAdminPanel` (port shown in Aspire dashboard)
   - The dashboard will show all 9 entities with links to manage each one

4. **Access pgAdmin** (optional):
   - pgAdmin will be available at the port shown in the Aspire dashboard
   - Use it to inspect the PostgreSQL databases

## 📊 Sample Entities

The sample includes 9 different DbContext models:

### 1. UserDbContext
- **Database**: `users_db`
- **Entities**: `User`
- **Features**: User management with profiles

### 2. ProductDbContext
- **Database**: `products_db`
- **Entities**: `Product`, `Category`, `ProductCategory`
- **Features**: Product catalog with categories

### 3. OrderDbContext
- **Database**: `orders_db`
- **Entities**: `Order`, `OrderItem`, `Customer`, `CustomerProfile`
- **Features**: E-commerce order management

### 4. BlogDbContext
- **Database**: `blog_db`
- **Entities**: `BlogPost`
- **Features**: Blog post management

### 5. CategoryDbContext
- **Database**: `categories_db`
- **Entities**: `Category`, `SimpleCategory`
- **Features**: Simple and complex category management

### 6. EmployeeDbContext
- **Database**: `employees_db`
- **Entities**: `Employee`, `Department`, `Project`, `ProjectMilestone`, `EmployeeProject`, `Task`, `TaskCollaborator`
- **Features**: HR management with relationships

### 7. InvoiceDbContext
- **Database**: `invoices_db`
- **Entities**: `Invoice`, `PaymentMethod`
- **Features**: Invoice and payment tracking

### 8. NotificationDbContext
- **Database**: `notifications_db`
- **Entities**: `Notification`
- **Features**: Notification management

### 9. ECommerceDbContext
- **Database**: `ecommerce_db`
- **Entities**: Multiple e-commerce related entities
- **Features**: Complete e-commerce system

## 🏗️ Project Structure

```
DBAdminPanel.Sample/
├── Models/              # Entity models
│   ├── User.cs
│   ├── Product.cs
│   ├── Order.cs
│   └── ...
├── Data/                # DbContext classes
│   ├── UserDbContext.cs
│   ├── ProductDbContext.cs
│   └── ...
├── Migrations/          # EF Core migrations
│   ├── UserDbContextMigrations/
│   ├── ProductDbContextMigrations/
│   └── ...
└── Program.cs           # Application startup and configuration
```

## 🔧 Configuration

### Database Configuration

Each DbContext uses a separate PostgreSQL database:

```csharp
// Example from Program.cs
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(userConnectionString));

builder.Services.AddDbContext<ProductDbContext>(options =>
    options.UseNpgsql(productConnectionString));
```

### Connection Strings

Connection strings are configured in `appsettings.json` and `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "UserDbContext": "Host=localhost;Database=users_db;...",
    "ProductDbContext": "Host=localhost;Database=products_db;..."
  }
}
```

### Aspire Configuration

The AppHost (`DBAdminPanel.AppHost`) automatically:
- Provisions PostgreSQL containers
- Configures connection strings
- Sets up pgAdmin for database management
- Provides service discovery

## 🎨 Generated Controllers

The DBAdminPanel source generator automatically creates controllers at:

- `/DBAdminPanel/User` - User management
- `/DBAdminPanel/Product` - Product management
- `/DBAdminPanel/Order` - Order management
- `/DBAdminPanel/BlogPost` - Blog post management
- `/DBAdminPanel/Category` - Category management
- `/DBAdminPanel/Employee` - Employee management
- `/DBAdminPanel/Invoice` - Invoice management
- `/DBAdminPanel/Notification` - Notification management

Each controller provides:
- **List View**: Paginated, sortable, filterable entity list
- **Create**: Form to create new entities
- **Edit**: Form to edit existing entities
- **Details**: View entity details
- **Delete**: Delete entities with confirmation

## 🔌 API Endpoints

All entities also have REST API endpoints:

### List Entities
```http
GET /api/DBAdminPanel/{EntityName}?page=1&pageSize=10&sortBy=Name&sortOrder=asc
```

### Get Entity by ID
```http
GET /api/DBAdminPanel/{EntityName}/{id}
```

### Create Entity
```http
POST /api/DBAdminPanel/{EntityName}
Content-Type: application/json

{
  "name": "Example",
  "description": "Example description"
}
```

### Update Entity
```http
PUT /api/DBAdminPanel/{EntityName}/{id}
Content-Type: application/json

{
  "id": 1,
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Entity
```http
DELETE /api/DBAdminPanel/{EntityName}/{id}
```

### Get Metadata
```http
GET /api/DBAdminPanel/{EntityName}/metadata
```

## 📝 Example Usage

### Creating a User

1. Navigate to `/DBAdminPanel/User`
2. Click "Create New"
3. Fill in the form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Age: 30
4. Click "Create"
5. The user is created and you're redirected to the list

### Viewing Entity Relationships

1. Navigate to `/DBAdminPanel/Employee`
2. Click on an employee's "Details"
3. View related entities (Department, Projects, Tasks)
4. Click on relationship links to navigate

### Using the API

```bash
# Get all products
curl https://localhost:5001/api/DBAdminPanel/Product

# Create a product
curl -X POST https://localhost:5001/api/DBAdminPanel/Product \
  -H "Content-Type: application/json" \
  -d '{"name":"New Product","price":99.99,"description":"A new product"}'

# Get product metadata
curl https://localhost:5001/api/DBAdminPanel/Product/metadata
```

## 🗄️ Database Migrations

Migrations are already created for all DbContexts. To create new migrations:

```bash
# For UserDbContext
dotnet ef migrations add MigrationName --context UserDbContext --project src/DBAdminPanel.Sample

# Apply migrations
dotnet ef database update --context UserDbContext --project src/DBAdminPanel.Sample
```

Or use the provided PowerShell script:

```powershell
.\add-migrations.ps1
```

## 🧪 Testing the Admin Panel

### Test Scenarios

1. **CRUD Operations**:
   - Create entities with various data types
   - Edit existing entities
   - Delete entities
   - View entity details

2. **Filtering and Sorting**:
   - Filter entities by different properties
   - Sort by various columns
   - Test pagination with large datasets

3. **Relationships**:
   - Create entities with foreign key relationships
   - Navigate between related entities
   - Test cascade delete (if configured)

4. **Validation**:
   - Test required field validation
   - Test data type validation
   - Test range validation

5. **API Testing**:
   - Use the REST API endpoints
   - Test pagination parameters
   - Test error handling

## 🐛 Troubleshooting

### Issue: Admin panel not loading

**Solution**: Ensure you've called `app.UseDBAdminPanel()` in `Program.cs` and that your DbContext is registered.

### Issue: Entities not appearing

**Solution**: 
1. Check that your DbContext has `DbSet<T>` properties
2. Ensure the source generator has run (rebuild the project)
3. Check the generated code in `obj/Debug/net10.0/generated/`

### Issue: Database connection errors

**Solution**: 
1. Ensure PostgreSQL is running (check Aspire dashboard)
2. Verify connection strings in `appsettings.json`
3. Run migrations: `dotnet ef database update`

### Issue: Angular UI not loading

**Solution**: 
1. Check browser console for errors
2. Verify static files are being served from `/DBAdminPanel` path
3. Ensure `wwwroot` folder exists in the package

## 📚 Learn More

- [Main README](../../README.md) - Complete documentation
- [Entity Framework Core Docs](https://learn.microsoft.com/en-us/ef/core/)
- [.NET Aspire Docs](https://learn.microsoft.com/en-us/dotnet/aspire/)
- [Angular Material Docs](https://material.angular.io/)

## 🎓 Next Steps

After exploring the sample:

1. **Customize Entities**: Add your own entities and DbContexts
2. **Configure Relationships**: Set up foreign keys and navigation properties
3. **Add Validation**: Use data annotations for validation
4. **Customize UI**: Modify the Angular components (if building from source)
5. **Extend Controllers**: Add custom actions to generated controllers

## 💡 Tips

- Use the Aspire dashboard to monitor database connections and performance
- Check the generated code in `obj/` folder to understand how controllers are created
- Use the metadata API to build custom UIs
- Enable logging to see source generator output

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue on GitHub!

---

**Happy Admin Panel Building! 🚀**
