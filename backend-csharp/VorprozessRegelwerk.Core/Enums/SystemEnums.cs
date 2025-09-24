namespace VorprozessRegelwerk.Core.Enums;

public enum FieldType
{
    Text,
    Select,
    Document
}

public enum FieldVisibility
{
    Visible,
    Editable
}

public enum FieldRequirement
{
    Optional,
    Required
}

public enum DocumentMode
{
    Download,
    DownloadUpload,
    DownloadMetadataUpload,
    Upload
}

public enum SelectType
{
    Radio,
    Multiple
}

public enum UserRole
{
    Anmelder,
    Klient,
    Admin
}

public enum Language
{
    De,
    Fr,
    It
}