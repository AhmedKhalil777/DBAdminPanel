using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class CategoryDbContext : DbContext
{
    public CategoryDbContext(DbContextOptions<CategoryDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
}


