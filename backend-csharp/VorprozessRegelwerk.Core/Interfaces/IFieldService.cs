using VorprozessRegelwerk.Core.DTOs;

namespace VorprozessRegelwerk.Core.Interfaces;

public interface IFieldService
{
    Task<IEnumerable<FieldResponseDto>> GetAllFieldsAsync();
    Task<FieldResponseDto?> GetFieldByIdAsync(string id);
    Task<FieldResponseDto> CreateFieldAsync(FieldCreateDto fieldDto, string userId = "system");
    Task<FieldResponseDto?> UpdateFieldAsync(string id, Dictionary<string, object> fieldData, string userId = "system");
    Task<bool> DeleteFieldAsync(string id, string userId = "system");
    Task<object> ValidateFieldValueAsync(string fieldId, object value);
    Task<object> GetValidationSchemaAsync(string fieldType);
}