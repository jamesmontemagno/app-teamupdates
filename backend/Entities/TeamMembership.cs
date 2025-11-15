namespace TeamUpdates.Backend.Entities;

public class TeamMembership
{
    public Guid UserId { get; set; }
    public Guid TeamId { get; set; }
    public DateTime JoinedAt { get; set; }
    
    public UserProfile User { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
