namespace DBAdminPanel.Sample.Models;

public class ECommerceCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Slug { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }

    // Self-referencing relationship (hierarchical categories)
    public int? ParentCategoryId { get; set; }
    public ECommerceCategory? ParentCategory { get; set; }
    public ICollection<ECommerceCategory> SubCategories { get; set; } = [];

    // Many-to-many relationship with Products
    public ICollection<ProductCategory> ProductCategories { get; set; } = [];
}
