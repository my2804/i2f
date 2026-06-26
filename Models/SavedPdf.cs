using i2f.Data;
using i2f.Data.ImageToPDF.Data;
using System.ComponentModel.DataAnnotations;

namespace i2f.Models
{
    public class SavedPdf
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        public string Orientation { get; set; } = "Portrait";

        public int PageCount { get; set; }

        public long FileSizeBytes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public ApplicationUser? User { get; set; }
    }
}