namespace DBAdminPanel.Sample.Models;

public class ECommerceOrder
{
    public Guid OrderId { get; set; }
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, Processing, Shipped, Delivered, Cancelled
    public string ShippingAddress { get; set; } = string.Empty;
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public string? TrackingNumber { get; set; }

    // Many-to-one relationship
    public Customer Customer { get; set; } = null!;

    // One-to-many relationship
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}




