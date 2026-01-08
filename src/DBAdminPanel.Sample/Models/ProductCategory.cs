namespace DBAdminPanel.Sample.Models;

// Join entity for many-to-many relationship
public class ProductCategory
{
    public int ProductId { get; set; }
    public int CategoryId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public bool IsPrimary { get; set; }

    // Navigation properties
    public ECommerceProduct Product { get; set; } = null!;
    public ECommerceCategory Category { get; set; } = null!;
}

