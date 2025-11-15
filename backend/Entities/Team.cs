namespace TeamUpdates.Backend.Entities;

public class Team
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public ICollection<TeamMembership> Memberships { get; set; } = new List<TeamMembership>();
    public ICollection<TeamUpdate> Updates { get; set; } = new List<TeamUpdate>();
}
