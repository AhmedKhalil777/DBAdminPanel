namespace DBAdminPanel.Sample.Models;

public class OrderItem
{
    public int Id { get; set; }
    public Guid OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalPrice { get; set; }

    // Many-to-one relationships
    public ECommerceOrder Order { get; set; } = null!;
    public ECommerceProduct Product { get; set; } = null!;
}

