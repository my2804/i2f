namespace i2f.Models
{

    public class PdfRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public List<ImageEntry> Images { get; set; } = new();
        public PdfOptions Options { get; set; } = new();
    }
}
