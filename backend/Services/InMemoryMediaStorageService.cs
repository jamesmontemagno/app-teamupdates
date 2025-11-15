using System.Collections.Concurrent;

namespace TeamUpdates.Backend.Services;

public class InMemoryMediaStorageService : IMediaStorageService
{
    private readonly ConcurrentDictionary<string, string> _storage = new();

    public Task<string> StoreMediaAsync(string mediaData, string mediaType, string fileName)
    {
        var mediaId = Guid.NewGuid().ToString();
        _storage[mediaId] = mediaData;
        return Task.FromResult(mediaId);
    }

    public Task<string?> GetMediaAsync(string mediaId)
    {
        _storage.TryGetValue(mediaId, out var mediaData);
        return Task.FromResult(mediaData);
    }

    public Task DeleteMediaAsync(string mediaId)
    {
        _storage.TryRemove(mediaId, out _);
        return Task.CompletedTask;
    }
}
