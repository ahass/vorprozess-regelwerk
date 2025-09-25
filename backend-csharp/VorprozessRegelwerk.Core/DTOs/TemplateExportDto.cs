using VorprozessRegelwerk.Core.Entities;
using System.Text.Json.Nodes;

using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.DTOs;

public class SelectOptionExportDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public MultiLanguageTextDto Label { get; set; } = new();
    public string Value { get; set; } = string.Empty;
}

public class FieldDependencyExportDto
{
    public string FieldId { get; set; } = string.Empty;
    public MultiLanguageTextDto FieldName { get; set; } = new();
    public string Operator { get; set; } = "equals";
    public object? ConditionValue { get; set; }
}

public class FieldExportDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text/select/document
    public MultiLanguageTextDto Name { get; set; } = new();
    public List<SelectOptionExportDto> Options { get; set; } = new();
    public List<FieldDependencyExportDto> Dependencies { get; set; } = new();
}

public class TemplateExportDto
{
    public string Id { get; set; } = string.Empty;
    public MultiLanguageTextDto Name { get; set; } = new();
    public MultiLanguageTextDto? Description { get; set; }
    public List<FieldExportDto> Fields { get; set; } = new();
}
