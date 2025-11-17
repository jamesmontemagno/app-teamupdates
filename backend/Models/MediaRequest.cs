namespace TeamUpdates.Backend.Models;

public record MediaRequest(string Type, string? DataUrl, string? Name, int? Duration, int? Size);
