namespace i2f.Models
{
    public class SavePdfRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string Title { get; set; } = "My PDF";
        public string Orientation { get; set; } = "Portrait";
        public int PageCount { get; set; }
    }
}