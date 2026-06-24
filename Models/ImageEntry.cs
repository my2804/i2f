namespace i2f.Models
{
    public class ImageEntry
    {
        public string FileId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public int SortOrder { get; set; }
        public string TempFilePath { get; set; } = string.Empty;
    }
}
