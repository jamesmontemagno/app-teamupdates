using Microsoft.AspNetCore.SignalR;
using TeamUpdates.Backend.Entities;

namespace TeamUpdates.Backend.Hubs;

public class UpdatesHub : Hub
{
    // Client methods that can be called from the hub
    // Clients.All.SendAsync("UpdateCreated", update) will call this method on all connected clients
    
    public async Task SendUpdateCreated(TeamUpdate update)
    {
        await Clients.All.SendAsync("UpdateCreated", update);
    }
    
    public async Task JoinTeam(string teamId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, teamId);
    }
    
    public async Task LeaveTeam(string teamId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, teamId);
    }
    
    public async Task SendUpdateToTeam(string teamId, TeamUpdate update)
    {
        await Clients.Group(teamId).SendAsync("UpdateCreated", update);
    }
}
