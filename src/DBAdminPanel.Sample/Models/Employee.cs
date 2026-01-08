namespace DBAdminPanel.Sample.Models;

public class OrganizationEmployee
{
    public int EmployeeId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public decimal Salary { get; set; }
    public DateTime HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public bool IsActive { get; set; } = true;
    public int DepartmentId { get; set; }
    public int? ManagerId { get; set; }

    // Many-to-one relationships
    public Department Department { get; set; } = null!;
    public OrganizationEmployee? Manager { get; set; }

    // Self-referencing relationship (manager-subordinate)
    public ICollection<OrganizationEmployee> Subordinates { get; set; } = [];

    // Many-to-many relationships
    public ICollection<EmployeeProject> EmployeeProjects { get; set; } = [];
    public ICollection<TaskCollaborator> TaskCollaborations { get; set; } = [];

    // One-to-many relationships
    public ICollection<Project> ManagedProjects { get; set; } = [];
    public ICollection<ProjectTask> AssignedTasks { get; set; } = [];
}




