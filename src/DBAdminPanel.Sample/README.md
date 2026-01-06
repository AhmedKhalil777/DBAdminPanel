# DBAdminPanel Sample Application

This sample application demonstrates how to use the DBAdminPanel source generator with 8 different DbContext models, PostgreSQL, and Aspire.

## Features

- **8 DbContext Models**: 
  - UserDbContext (Users)
  - ProductDbContext (Products)
  - OrderDbContext (Orders)
  - BlogDbContext (BlogPosts)
  - CategoryDbContext (Categories)
  - EmployeeDbContext (Employees)
  - InvoiceDbContext (Invoices)
  - NotificationDbContext (Notifications)

- **PostgreSQL Integration**: All DbContexts are configured to use PostgreSQL databases
- **Aspire Integration**: PostgreSQL and pgAdmin are automatically provisioned via Aspire
- **Auto-Generated Admin Panel**: The DBAdminPanel source generator automatically creates CRUD controllers for all entities

## Running the Application

1. **Run the Aspire AppHost**:
   ```bash
   cd src/DBAdminPanel.AppHost
   dotnet run
   ```

2. **Access the Admin Panel**:
   - Navigate to `https://localhost:XXXX/DBAdminPanel` (port will be shown in Aspire dashboard)
   - The dashboard will show all 8 entities with links to manage each one

3. **Access pgAdmin**:
   - pgAdmin will be available at the port shown in the Aspire dashboard
   - Use it to inspect the PostgreSQL databases

## Project Structure

```
DBAdminPanel.Sample/
├── Models/          # Entity models
├── Data/            # DbContext classes
├── Views/           # MVC views (including dashboard)
└── Program.cs       # Application startup and configuration
```

## Database Configuration

Each DbContext uses a separate database:
- `users_db` - UserDbContext
- `products_db` - ProductDbContext
- `orders_db` - OrderDbContext
- `blog_db` - BlogDbContext
- `categories_db` - CategoryDbContext
- `employees_db` - EmployeeDbContext
- `invoices_db` - InvoiceDbContext
- `notifications_db` - NotificationDbContext

## Generated Controllers

The DBAdminPanel source generator automatically creates controllers at:
- `/DBAdminPanel/User` - User management
- `/DBAdminPanel/Product` - Product management
- `/DBAdminPanel/Order` - Order management
- `/DBAdminPanel/BlogPost` - Blog post management
- `/DBAdminPanel/Category` - Category management
- `/DBAdminPanel/Employee` - Employee management
- `/DBAdminPanel/Invoice` - Invoice management
- `/DBAdminPanel/Notification` - Notification management

Each controller provides full CRUD operations (Create, Read, Update, Delete).



