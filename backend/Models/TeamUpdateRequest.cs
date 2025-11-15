namespace TeamUpdates.Backend.Models;

public record TeamUpdateRequest(
    Guid UserId,
    string DayKey,
    string Category,
    string Text,
    LocationRequest? Location,
    MediaRequest? Media
);
