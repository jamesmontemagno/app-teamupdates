namespace TeamUpdates.Backend.Entities;

public class TeamUpdate
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Guid UserId { get; set; }
    public required string UserDisplayName { get; set; }
    public required string UserEmoji { get; set; }
    public string? UserPhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string DayKey { get; set; } // Format: YYYY-MM-DD
    public required string Category { get; set; } // team, life, win, blocker
    public required string Text { get; set; }
    public string? MediaJson { get; set; } // JSON: {type, dataUrl, name, duration, size}
    public string? LocationJson { get; set; } // JSON: {lat, lng, label, accuracy}
    
    public Team Team { get; set; } = null!;
}
