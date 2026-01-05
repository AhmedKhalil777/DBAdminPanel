using Microsoft.EntityFrameworkCore;
using DBAdminPanel.Sample.Models;

namespace DBAdminPanel.Sample.Data;

public class InvoiceDbContext : DbContext
{
    public InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : base(options)
    {
    }

    public DbSet<Invoice> Invoices { get; set; }
}


