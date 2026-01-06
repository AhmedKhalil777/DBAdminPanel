using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders { get; set; }
}



