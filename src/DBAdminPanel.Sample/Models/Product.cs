namespace DBAdminPanel.Sample.Models;

public class ECommerceProduct
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string SKU { get; set; } = string.Empty;
    public decimal? Weight { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Many-to-many relationship with Categories
    public ICollection<ProductCategory> ProductCategories { get; set; } = [];

    // One-to-many relationship with OrderItems
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}




