namespace DBAdminPanel.Sample.Models;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateTime EstablishedDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Self-referencing relationship (hierarchical departments)
    public int? ParentDepartmentId { get; set; }
    public Department? ParentDepartment { get; set; }
    public ICollection<Department> SubDepartments { get; set; } = [];

    // One-to-many relationships
    public ICollection<OrganizationEmployee> Employees { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
}

