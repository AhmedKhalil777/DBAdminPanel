using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class EmployeeDbContext : DbContext
{
    public EmployeeDbContext(DbContextOptions<EmployeeDbContext> options) : base(options)
    {
    }

    public DbSet<SimpleEmployee> Employees { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("employees");

        modelBuilder.Entity<SimpleEmployee>(entity =>
        {
            entity.HasKey(e => e.EmployeeId);
            entity.Property(e => e.Salary).HasPrecision(18, 2);
        });
    }
}




