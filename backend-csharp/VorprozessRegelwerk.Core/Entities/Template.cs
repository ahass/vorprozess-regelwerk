using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace VorprozessRegelwerk.Core.Entities;

public class Template
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column(TypeName = "nvarchar(max)")]
    public string RoleConfig { get; set; } = "{}";

    public bool CustomerSpecific { get; set; } = false;

    [Column(TypeName = "nvarchar(max)")]
    public string VisibleForCustomers { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual ICollection<TemplateField> TemplateFields { get; set; } = new List<TemplateField>();
    public virtual ICollection<MultiLanguageText> Names { get; set; } = new List<MultiLanguageText>();
    public virtual ICollection<MultiLanguageText> Descriptions { get; set; } = new List<MultiLanguageText>();

    // Helper properties
    [NotMapped]
    public Dictionary<string, object> RoleConfigObject
    {
        get => JsonConvert.DeserializeObject<Dictionary<string, object>>(RoleConfig) ?? new Dictionary<string, object>();
        set => RoleConfig = JsonConvert.SerializeObject(value);
    }

    [NotMapped]
    public List<string> VisibleForCustomersList
    {
        get => JsonConvert.DeserializeObject<List<string>>(VisibleForCustomers) ?? new List<string>();
        set => VisibleForCustomers = JsonConvert.SerializeObject(value);
    }
}

public class TemplateField
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string TemplateId { get; set; } = string.Empty;

    [Required] 
    public string FieldId { get; set; } = string.Empty;

    public int Order { get; set; } = 0;

    // Navigation properties
    [ForeignKey(nameof(TemplateId))]
    public virtual Template Template { get; set; } = null!;

    [ForeignKey(nameof(FieldId))]
    public virtual Field Field { get; set; } = null!;
}