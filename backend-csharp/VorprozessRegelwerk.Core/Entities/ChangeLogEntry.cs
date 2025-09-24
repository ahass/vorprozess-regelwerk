using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace VorprozessRegelwerk.Core.Entities;

public class ChangeLogEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(20)]
    public string EntityType { get; set; } = string.Empty; // "template" or "field"

    [Required]
    public string EntityId { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Action { get; set; } = string.Empty; // "created", "updated", "deleted"

    [Column(TypeName = "nvarchar(max)")]
    public string Changes { get; set; } = "{}";

    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string UserName { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Helper property
    [NotMapped]
    public Dictionary<string, object> ChangesObject
    {
        get => JsonConvert.DeserializeObject<Dictionary<string, object>>(Changes) ?? new Dictionary<string, object>();
        set => Changes = JsonConvert.SerializeObject(value);
    }
}