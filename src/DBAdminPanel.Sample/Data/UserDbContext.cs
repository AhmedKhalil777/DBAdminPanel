using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
}



