namespace DBAdminPanel.Sample.Models;

public class ProjectTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "ToDo"; // ToDo, InProgress, InReview, Done, Blocked
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int ProjectId { get; set; }
    public int? AssignedToId { get; set; }
    public int? ParentTaskId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }

    // Many-to-one relationships
    public Project Project { get; set; } = null!;
    public OrganizationEmployee? AssignedTo { get; set; }

    // Self-referencing relationship (subtasks)
    public ProjectTask? ParentTask { get; set; }
    public ICollection<ProjectTask> Subtasks { get; set; } = [];

    // Many-to-many relationship with Employees (collaborators)
    public ICollection<TaskCollaborator> Collaborators { get; set; } = [];
}

