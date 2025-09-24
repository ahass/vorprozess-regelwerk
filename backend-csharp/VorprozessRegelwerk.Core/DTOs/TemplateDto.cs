using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.DTOs;

public class TemplateCreateDto
{
    public MultiLanguageTextDto Name { get; set; } = new();
    public MultiLanguageTextDto? Description { get; set; }
}

public class TemplateUpdateDto
{
    public MultiLanguageTextDto? Name { get; set; }
    public MultiLanguageTextDto? Description { get; set; }
    public List<string>? Fields { get; set; }
}

public class TemplateResponseDto
{
    public string Id { get; set; } = string.Empty;
    public MultiLanguageTextDto Name { get; set; } = new();
    public MultiLanguageTextDto? Description { get; set; }
    public List<string> Fields { get; set; } = new();
    public Dictionary<string, object> RoleConfig { get; set; } = new();
    public bool CustomerSpecific { get; set; }
    public List<string> VisibleForCustomers { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class TemplateRenderRequestDto
{
    public List<string> TemplateIds { get; set; } = new();
    public UserRole Role { get; set; }
    public string? CustomerId { get; set; }
    public Language Language { get; set; } = Language.De;
}

public class TemplateRenderResponseDto
{
    public List<object> Templates { get; set; } = new();
    public List<object> Fields { get; set; } = new();
}