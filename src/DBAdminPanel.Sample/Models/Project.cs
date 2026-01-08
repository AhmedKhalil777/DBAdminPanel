namespace DBAdminPanel.Sample.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal Budget { get; set; }
    public string Status { get; set; } = "Planning"; // Planning, InProgress, OnHold, Completed, Cancelled
    public int DepartmentId { get; set; }
    public int? ManagerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Many-to-one relationships
    public Department Department { get; set; } = null!;
    public OrganizationEmployee? Manager { get; set; }

    // Many-to-many relationship with Employees
    public ICollection<EmployeeProject> EmployeeProjects { get; set; } = [];

    // One-to-many relationships
    public ICollection<ProjectTask> Tasks { get; set; } = [];
    public ICollection<ProjectMilestone> Milestones { get; set; } = [];
}

