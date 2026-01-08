namespace DBAdminPanel.Sample.Models;

// Join entity for many-to-many relationship
public class EmployeeProject
{
    public int EmployeeId { get; set; }
    public int ProjectId { get; set; }
    public string Role { get; set; } = string.Empty; // Developer, Tester, Designer, etc.
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedDate { get; set; }
    public decimal? AllocationPercentage { get; set; } // 0-100

    // Navigation properties
    public OrganizationEmployee Employee { get; set; } = null!;
    public Project Project { get; set; } = null!;
}

