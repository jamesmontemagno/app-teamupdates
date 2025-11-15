using Microsoft.EntityFrameworkCore;
using TeamUpdates.Backend.Entities;

namespace TeamUpdates.Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Team> Teams { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<TeamUpdate> TeamUpdates { get; set; }
    public DbSet<TeamMembership> TeamMemberships { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure composite key for TeamMembership
        modelBuilder.Entity<TeamMembership>()
            .HasKey(tm => new { tm.UserId, tm.TeamId });

        // Configure relationships
        modelBuilder.Entity<TeamMembership>()
            .HasOne(tm => tm.User)
            .WithMany(u => u.Memberships)
            .HasForeignKey(tm => tm.UserId);

        modelBuilder.Entity<TeamMembership>()
            .HasOne(tm => tm.Team)
            .WithMany(t => t.Memberships)
            .HasForeignKey(tm => tm.TeamId);

        modelBuilder.Entity<TeamUpdate>()
            .HasOne(tu => tu.Team)
            .WithMany(t => t.Updates)
            .HasForeignKey(tu => tu.TeamId);

        // Seed default public team
        var defaultTeamId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        modelBuilder.Entity<Team>().HasData(new Team
        {
            Id = defaultTeamId,
            Name = "Default Team",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        });
    }
}
