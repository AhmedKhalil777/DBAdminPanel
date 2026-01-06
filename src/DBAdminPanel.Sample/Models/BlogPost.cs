namespace DBAdminPanel.Sample.Models;

public class BlogPost
{
    public int BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public int Views { get; set; }
    public bool IsPublished { get; set; }
}



