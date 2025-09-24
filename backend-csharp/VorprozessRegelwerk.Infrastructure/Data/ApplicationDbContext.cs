using Microsoft.EntityFrameworkCore;
using VorprozessRegelwerk.Core.Entities;

namespace VorprozessRegelwerk.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Template> Templates { get; set; }
    public DbSet<Field> Fields { get; set; }
    public DbSet<TemplateField> TemplateFields { get; set; }
    public DbSet<MultiLanguageText> MultiLanguageTexts { get; set; }
    public DbSet<ChangeLogEntry> ChangeLogEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Template configuration
        modelBuilder.Entity<Template>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            
            entity.HasMany(e => e.TemplateFields)
                  .WithOne(e => e.Template)
                  .HasForeignKey(e => e.TemplateId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Template: Names = MultiLanguageText mit EntityType = "template_name"
            entity.HasMany(e => e.Names)
                  .WithMany()
                  .UsingEntity<MultiLanguageText>(
                      r => r.HasOne<Template>().WithMany().HasForeignKey(x => x.EntityId),
                      l => l.HasOne<MultiLanguageText>().WithMany(),
                      je =>
                      {
                          je.ToTable("MultiLanguageTexts");
                      }
                  );

            // Template: Descriptions = MultiLanguageText mit EntityType = "template_description"
            entity.HasMany(e => e.Descriptions)
                  .WithMany()
                  .UsingEntity<MultiLanguageText>(
                      r => r.HasOne<Template>().WithMany().HasForeignKey(x => x.EntityId),
                      l => l.HasOne<MultiLanguageText>().WithMany(),
                      je =>
                      {
                          je.ToTable("MultiLanguageTexts");
                      }
                  );
        });

        // Field configuration
        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            
            entity.Property(e => e.Type)
                  .HasConversion<string>();
                  
            entity.Property(e => e.Visibility)
                  .HasConversion<string>();
                  
            entity.Property(e => e.Requirement)
                  .HasConversion<string>();
                  
            entity.Property(e => e.SelectType)
                  .HasConversion<string>();
                  
            entity.Property(e => e.DocumentMode)
                  .HasConversion<string>();

            entity.HasMany(e => e.TemplateFields)
                  .WithOne(e => e.Field)
                  .HasForeignKey(e => e.FieldId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Names)
                  .WithOne(e => e.Field)
                  .HasForeignKey(e => e.EntityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TemplateField configuration (Many-to-Many junction)
        modelBuilder.Entity<TemplateField>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            
            entity.HasIndex(e => new { e.TemplateId, e.FieldId })
                  .IsUnique();
        });

        // MultiLanguageText configuration
        modelBuilder.Entity<MultiLanguageText>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            
            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.LanguageCode })
                  .IsUnique();
        });

        // ChangeLogEntry configuration
        modelBuilder.Entity<ChangeLogEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });
        });
    }
}