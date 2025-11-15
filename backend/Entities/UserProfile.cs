namespace TeamUpdates.Backend.Entities;

public class UserProfile
{
    public Guid Id { get; set; }
    public required string DisplayName { get; set; }
    public required string Color { get; set; }
    public required string Emoji { get; set; }
    public string? PhotoUrl { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? DefaultLocationJson { get; set; } // JSON: {lat, lng, displayName}
    public int RandomizationRadius { get; set; } = 100;
    public string? LastLocationJson { get; set; } // JSON: {city, state, country, label}
    
    public ICollection<TeamMembership> Memberships { get; set; } = new List<TeamMembership>();
}
