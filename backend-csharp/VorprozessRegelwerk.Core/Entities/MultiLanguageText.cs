using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.Entities;

public class MultiLanguageText
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(50)]
    public string EntityType { get; set; } = string.Empty;

    [Required]
    public string EntityId { get; set; } = string.Empty;

    [Required]
    [MaxLength(2)]
    public string LanguageCode { get; set; } = string.Empty;

    [Required]
    public string TextValue { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(EntityId))]
    public virtual Template? Template { get; set; }

    [ForeignKey(nameof(EntityId))]
    public virtual Field? Field { get; set; }
}

// Helper class for multilanguage text operations
public class MultiLanguageTextDto
{
    public string De { get; set; } = string.Empty;
    public string Fr { get; set; } = string.Empty;
    public string It { get; set; } = string.Empty;

    public Dictionary<string, string> ToDictionary()
    {
        return new Dictionary<string, string>
        {
            ["de"] = De,
            ["fr"] = Fr,
            ["it"] = It
        };
    }

    public static MultiLanguageTextDto FromDictionary(Dictionary<string, string> dict)
    {
        return new MultiLanguageTextDto
        {
            De = dict.GetValueOrDefault("de", ""),
            Fr = dict.GetValueOrDefault("fr", ""),
            It = dict.GetValueOrDefault("it", "")
        };
    }
}