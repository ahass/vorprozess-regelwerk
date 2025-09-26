using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.DTOs;

public class FieldCreateDto
{
    public MultiLanguageTextDto Name { get; set; } = new();
    public FieldType Type { get; set; }
    public FieldVisibility Visibility { get; set; } = FieldVisibility.Editable;
    public FieldRequirement Requirement { get; set; } = FieldRequirement.Optional;
    public FieldValidationDto? Validation { get; set; }
    public SelectType? SelectType { get; set; }
    public List<SelectOptionDto>? Options { get; set; }
    public DocumentMode? DocumentMode { get; set; }
    public DocumentConstraintsDto? DocumentConstraints { get; set; }
    public Dictionary<string, object>? RoleConfig { get; set; }
}

public class FieldResponseDto
{
    public string Id { get; set; } = string.Empty;
    public MultiLanguageTextDto Name { get; set; } = new();
    public FieldType Type { get; set; }
    public FieldVisibility Visibility { get; set; }
    public FieldRequirement Requirement { get; set; }
    public Dictionary<string, object>? Validation { get; set; }
    public SelectType? SelectType { get; set; }
    public List<Dictionary<string, object>>? Options { get; set; }
    public DocumentMode? DocumentMode { get; set; }
    public Dictionary<string, object>? DocumentConstraints { get; set; }
    public Dictionary<string, object> RoleConfig { get; set; } = new();
    public bool CustomerSpecific { get; set; }
    public List<string> VisibleForCustomers { get; set; } = new();
    public List<Dictionary<string, object>> Dependencies { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FieldValidationDto
{
    public StringValidationDto? String { get; set; }
    public NumberValidationDto? Number { get; set; }
    public DateValidationDto? Date { get; set; }
    public FileValidationDto? File { get; set; }
}

public class StringValidationDto
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; }
    public string? PatternError { get; set; }
    public string? Format { get; set; } // email, phone, url
}

public class NumberValidationDto
{
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public bool IntegerOnly { get; set; }
    public int? MaxDecimalPlaces { get; set; }
}

public class DateValidationDto
{
    public string? Format { get; set; } = "yyyy-MM-dd";
    public string? MinDate { get; set; }
    public string? MaxDate { get; set; }
    public bool NoFutureDates { get; set; }
    public bool NoPastDates { get; set; }
}

public class FileValidationDto
{
    public double? MaxSizeMb { get; set; }
    public List<string>? AllowedExtensions { get; set; }
    public List<string>? AllowedMimeTypes { get; set; }
}

public class SelectOptionDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public MultiLanguageTextDto Label { get; set; } = new();
    public string Value { get; set; } = string.Empty;
}

public class DocumentConstraintsDto
{
    public double? MaxSizeMb { get; set; }
    public List<string>? AllowedFormats { get; set; }
    public List<string>? AllowedMimeTypes { get; set; }
}