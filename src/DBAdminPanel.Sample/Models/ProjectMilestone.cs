namespace DBAdminPanel.Sample.Models;

public class ProjectMilestone
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime TargetDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public bool IsCompleted { get; set; }
    public int DisplayOrder { get; set; }

    // Many-to-one relationship
    public Project Project { get; set; } = null!;
}

