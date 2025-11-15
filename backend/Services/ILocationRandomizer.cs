namespace TeamUpdates.Backend.Services;

public interface ILocationRandomizer
{
    (double lat, double lng) RandomizeCoordinates(double lat, double lng, int radiusMeters);
}
