namespace TeamUpdates.Backend.Services;

public interface IMediaStorageService
{
    Task<string> StoreMediaAsync(string mediaData, string mediaType, string fileName);
    Task<string?> GetMediaAsync(string mediaId);
    Task DeleteMediaAsync(string mediaId);
}
