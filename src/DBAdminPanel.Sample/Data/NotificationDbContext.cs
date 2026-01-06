using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications { get; set; }
}



