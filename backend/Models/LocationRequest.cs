namespace TeamUpdates.Backend.Models;

public record LocationRequest(double Lat, double Lng, string? Label, double? Accuracy);
