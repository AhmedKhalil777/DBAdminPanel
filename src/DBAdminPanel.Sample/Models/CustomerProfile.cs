namespace DBAdminPanel.Sample.Models;

public class CustomerProfile
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? Notes { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // One-to-one relationship
    public Customer Customer { get; set; } = null!;
}

