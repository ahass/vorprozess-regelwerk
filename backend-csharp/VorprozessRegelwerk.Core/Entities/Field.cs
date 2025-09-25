using System.ComponentModel.DataAnnotations;
using System.Text.Json;

using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;
using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.Entities;

public class Field
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public FieldType Type { get; set; } = FieldType.Text;

    [Required]
    public FieldVisibility Visibility { get; set; } = FieldVisibility.Editable;

    [Required]
    public FieldRequirement Requirement { get; set; } = FieldRequirement.Optional;

    [Column(TypeName = "TEXT")]
    public string Validation { get; set; } = "{}";

    public SelectType? SelectType { get; set; }

    [Column(TypeName = "TEXT")]
    public string Options { get; set; } = "[]";

    public DocumentMode? DocumentMode { get; set; }

    [Column(TypeName = "TEXT")]
    public string DocumentConstraints { get; set; } = "{}";

    [Column(TypeName = "TEXT")]
    public string RoleConfig { get; set; } = "{}";

    public bool CustomerSpecific { get; set; } = false;

    [Column(TypeName = "TEXT")]
    public string VisibleForCustomers { get; set; } = "[]";

    [Column(TypeName = "TEXT")]
    public string Dependencies { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<TemplateField> TemplateFields { get; set; } = new List<TemplateField>();
    // Diese Navigation wird nicht von EF gemappt; Services lesen MultiLanguageTexts manuell
    public virtual ICollection<MultiLanguageText> Names { get; set; } = new List<MultiLanguageText>();

    // Helper properties
    [NotMapped]
    public Dictionary<string, object> ValidationObject
    {
        get => JsonConvert.DeserializeObject<Dictionary<string, object>>(Validation) ?? new Dictionary<string, object>();
        set => Validation = JsonConvert.SerializeObject(value);
    }

    [NotMapped]
    public List<SelectOption> OptionsList
    {
        get
        {
            try
            {
                // Try as array of SelectOption
                var list = JsonConvert.DeserializeObject<List<SelectOption>>(Options);
                if (list != null) return list;
            }
            catch
            {
                // ignore
            }

            try
            {
                // Handle cases when Options accidentally contains System.Text.Json JsonElement or a single object
                var node = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.Nodes.JsonNode?>(Options);
                if (node is System.Text.Json.Nodes.JsonArray arr)
                {
                    var list = new List<SelectOption>();
                    foreach (var el in arr)
                    {
                        if (el == null) continue;
                        var so = System.Text.Json.JsonSerializer.Deserialize<SelectOption>(el.ToJsonString());
                        if (so != null) list.Add(so);
                    }
                    return list;
                }
                else if (node is System.Text.Json.Nodes.JsonObject obj)
                {
                    // If it's a single object, wrap it
                    var so = System.Text.Json.JsonSerializer.Deserialize<SelectOption>(obj.ToJsonString());
                    return so != null ? new List<SelectOption> { so } : new List<SelectOption>();
                }
            }
            catch
            {
                // ignore
            }

            return new List<SelectOption>();
        }
        set => Options = JsonConvert.SerializeObject(value ?? new List<SelectOption>());
    }

    [NotMapped]
    public DocumentConstraints DocumentConstraintsObject
    {
        get => JsonConvert.DeserializeObject<DocumentConstraints>(DocumentConstraints) ?? new DocumentConstraints();
        set => DocumentConstraints = JsonConvert.SerializeObject(value);
    }

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

    [NotMapped]
    public List<FieldDependency> DependenciesList
    {
        get
        {
            try
            {
                var list = JsonConvert.DeserializeObject<List<FieldDependency>>(Dependencies);
                if (list != null) return list;
            }
            catch { }

            try
            {
                var node = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.Nodes.JsonNode?>(Dependencies);
                if (node is System.Text.Json.Nodes.JsonArray arr)
                {
                    var list = new List<FieldDependency>();
                    foreach (var el in arr)
                    {
                        if (el == null) continue;
                        var dep = System.Text.Json.JsonSerializer.Deserialize<FieldDependency>(el.ToJsonString());
                        if (dep != null) list.Add(dep);
                    }
                    return list;
                }
                else if (node is System.Text.Json.Nodes.JsonObject obj)
                {
                    var dep = System.Text.Json.JsonSerializer.Deserialize<FieldDependency>(obj.ToJsonString());
                    return dep != null ? new List<FieldDependency> { dep } : new List<FieldDependency>();
                }
            }
            catch { }

            return new List<FieldDependency>();
        }
        set => Dependencies = JsonConvert.SerializeObject(value ?? new List<FieldDependency>());
    }
}

public class SelectOption
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public MultiLanguageText Label { get; set; } = new();
    public string Value { get; set; } = string.Empty;
}

public class DocumentConstraints
{
    public double? MaxSizeMb { get; set; }
    public List<string>? AllowedFormats { get; set; }
    public List<string>? AllowedMimeTypes { get; set; }
}

public class FieldDependency
{
    public string FieldId { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public object? ConditionValue { get; set; }
}