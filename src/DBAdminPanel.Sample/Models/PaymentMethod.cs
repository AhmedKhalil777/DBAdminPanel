namespace DBAdminPanel.Sample.Models;

public class PaymentMethod
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Type { get; set; } = string.Empty; // CreditCard, DebitCard, PayPal, etc.
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Many-to-one relationship
    public Customer Customer { get; set; } = null!;
}

