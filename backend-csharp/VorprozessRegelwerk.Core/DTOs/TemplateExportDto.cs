using VorprozessRegelwerk.Core.Entities;
using System.Text.Json.Nodes;

using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.DTOs;

public class FieldExportDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text/select/document
    public MultiLanguageTextDto Name { get; set; } = new();
    public List<FieldDependency> Dependencies { get; set; } = new();
}

public class TemplateExportDto
{
    public string Id { get; set; } = string.Empty;
    public MultiLanguageTextDto Name { get; set; } = new();
    public MultiLanguageTextDto? Description { get; set; }
    public List<FieldExportDto> Fields { get; set; } = new();
}
