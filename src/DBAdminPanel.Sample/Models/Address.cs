namespace DBAdminPanel.Sample.Models;

public class Address
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public string AddressType { get; set; } = "Home"; // Home, Work, Billing, Shipping

    // Many-to-one relationship
    public Customer Customer { get; set; } = null!;
}

