namespace TeamUpdates.Backend.Models;

public record UserProfileRequest(
    string DisplayName,
    string Color,
    string Emoji,
    string? PhotoUrl,
    string? City,
    string? State,
    string? Country,
    DefaultLocationRequest? DefaultLocation,
    int? RandomizationRadius,
    LastLocationRequest? LastLocation
);
