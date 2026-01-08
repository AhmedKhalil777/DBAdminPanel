namespace DBAdminPanel.Sample.Models;

// Join entity for many-to-many relationship
public class TaskCollaborator
{
    public int TaskId { get; set; }
    public int EmployeeId { get; set; }
    public string Role { get; set; } = "Collaborator"; // Collaborator, Reviewer, Observer
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ProjectTask Task { get; set; } = null!;
    public OrganizationEmployee Employee { get; set; } = null!;
}

