namespace i2f.Services
{
    using i2f.Models;
    using PdfSharpCore.Drawing;
    using PdfSharpCore.Pdf;
    using static System.Net.Mime.MediaTypeNames;

    namespace ImageToPDF.Services
    {
        public class PdfGeneratorService
        {
            public string Generate(PdfRequest request)
            {
                var doc = new PdfDocument();
                var isLandscape = request.Options.Orientation
                    .Equals("Landscape", StringComparison.OrdinalIgnoreCase);

                var images = request.Images.OrderBy(i => i.SortOrder).ToList();

                foreach (var entry in images)
                {
                    if (!File.Exists(entry.TempFilePath)) continue;

                    var page = doc.AddPage();
                    if (isLandscape)
                    {
                        page.Width = XUnit.FromMillimeter(297);
                        page.Height = XUnit.FromMillimeter(210);
                    }
                    else
                    {
                        page.Width = XUnit.FromMillimeter(210);
                        page.Height = XUnit.FromMillimeter(297);
                    }

                    using var gfx = XGraphics.FromPdfPage(page);
                    using var image = XImage.FromFile(entry.TempFilePath);

                    // Scale image to fit page while keeping aspect ratio
                    double scaleX = page.Width.Point / image.PixelWidth;
                    double scaleY = page.Height.Point / image.PixelHeight;
                    double scale = Math.Min(scaleX, scaleY);

                    double drawW = image.PixelWidth * scale;
                    double drawH = image.PixelHeight * scale;
                    double drawX = (page.Width.Point - drawW) / 2;
                    double drawY = (page.Height.Point - drawH) / 2;

                    gfx.DrawImage(image, drawX, drawY, drawW, drawH);
                }

                var outputPath = Path.Combine(
                    Path.GetDirectoryName(request.Images.First().TempFilePath)!,
                    "output.pdf");

                doc.Save(outputPath);
                return outputPath;
            }
        }
    }
}
