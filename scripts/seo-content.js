export const seoEnhancements = {
  'jpg-to-pdf': {
    intro: 'A strong JPG to PDF page must solve a real upload problem, not just convert a file. This page is written for users preparing certificates, receipts, homework, IDs, and phone photos for a single document upload.',
    bestFor: ['Combining phone photos into one upload-ready PDF', 'Creating certificate or receipt PDFs without installing software', 'Keeping image order predictable before download'],
    example: 'Example: upload 5 JPG certificate photos, choose A4 portrait, keep a small margin, then download one PDF for an application form.',
    troubleshooting: ['If a photo appears sideways, rotate the photo first with Rotate Image.', 'If the PDF is too large, use Compress PDF or Image Compressor after conversion.', 'If pages are in the wrong order, choose files again in the required sequence.'],
    quality: 'For document uploads, A4 portrait with small margins is usually safest. For photos, auto image size keeps the original proportions closer to the source.'
  },
  'merge-pdf': {
    intro: 'Merge PDF is one of the highest-intent document workflows. Users usually need exact order control, clean output, and no watermark.',
    bestFor: ['Combining certificates into one PDF', 'Joining invoices or receipts for accounting', 'Putting application documents in the required order'],
    example: 'Example: add Aadhaar.pdf, marksheet.pdf, certificate.pdf, move files up or down until the order is correct, then merge into one clean PDF.',
    troubleshooting: ['Remove a wrong file before merging instead of starting over.', 'Password-protected PDFs should be unlocked first.', 'For very large PDFs, test on desktop for better memory performance.'],
    quality: 'The output order follows the visible file list. This is safer than relying on browser file-selection order alone.'
  },
  'compress-pdf': {
    intro: 'This browser PDF optimizer is intentionally honest: it can reduce structure overhead but cannot guarantee professional server-side image recompression.',
    bestFor: ['Trying a quick local PDF re-save before uploading', 'Checking whether a PDF can be made smaller in-browser', 'Avoiding unnecessary server upload for simple PDFs'],
    example: 'Example: upload a 1.2MB form PDF and download an optimized copy. If the file is already optimized, the result may be the same size or slightly larger.',
    troubleshooting: ['If size does not reduce, compress the source images before creating the PDF.', 'For scanned PDFs, use image compression before converting to PDF.', 'For strict 100KB/200KB limits, test the output before final submission.'],
    quality: 'The page reports before/after size clearly instead of promising a fixed percentage reduction.'
  },
  'split-pdf': {
    intro: 'Split PDF helps users extract exactly the pages they need from a larger document without installing a desktop PDF editor.',
    bestFor: ['Extracting selected application pages', 'Saving one chapter from a larger PDF', 'Separating invoices or certificates into smaller files'],
    example: 'Example: enter 1-3,5,9 to extract only those pages into a downloadable ZIP or PDF output.',
    troubleshooting: ['Use commas for separate pages and hyphens for ranges.', 'If the page range is invalid, check the PDF page count first.', 'Encrypted PDFs may need unlocking before splitting.'],
    quality: 'Page numbers start at 1, matching normal PDF readers.'
  },
  'pdf-to-jpg': {
    intro: 'PDF to JPG is useful when a document page must be uploaded as an image or previewed in a system that does not accept PDFs.',
    bestFor: ['Creating image previews of PDF pages', 'Uploading a PDF page to image-only forms', 'Saving document pages as shareable JPG files'],
    example: 'Example: upload a 3-page PDF, choose balanced quality, and download a ZIP containing page-1.jpg, page-2.jpg, and page-3.jpg.',
    troubleshooting: ['Use high quality scale for small text.', 'For transparent or crisp UI screenshots, try PDF to PNG.', 'Large multi-page PDFs can take longer on phones.'],
    quality: 'JPG output is smaller for photo-like pages, while PNG is better for sharp text and screenshots.'
  },
  'pdf-to-text': {
    intro: 'PDF to Text extracts selectable text from digital PDFs. It is not OCR, so scanned image-only documents need a separate OCR tool.',
    bestFor: ['Copying text from reports', 'Extracting readable content from digital PDFs', 'Creating plain-text notes from PDF documents'],
    example: 'Example: upload a text-based report PDF and download a .txt file containing page-separated extracted text.',
    troubleshooting: ['If no text is found, the PDF is likely scanned or image-only.', 'Complex layouts may not preserve perfect reading order.', 'Password-protected PDFs should be unlocked first.'],
    quality: 'The tool gives a clear scanned-PDF message instead of silently returning an empty file.'
  },
  'image-resizer': {
    intro: 'Image Resizer is built for exact pixel-size tasks: form photos, profile images, website thumbnails, and social media images.',
    bestFor: ['Changing photo width and height for online forms', 'Creating smaller website thumbnails', 'Keeping aspect ratio while resizing large phone photos'],
    example: 'Example: upload a 4000px phone photo, set width to 1200px, keep aspect ratio, and download a smaller web-ready image.',
    troubleshooting: ['Use keep aspect ratio to avoid stretched faces or logos.', 'For strict file-size limits, resize first and then compress.', 'PNG is best for transparency; JPG/WebP are usually smaller for photos.'],
    quality: 'Resizing before compression usually produces better quality than aggressive compression alone.'
  },
  'image-compressor': {
    intro: 'Image Compressor focuses on quick browser-side size reduction with visible before/after size feedback.',
    bestFor: ['Reducing phone photo size before upload', 'Optimizing blog or website images', 'Creating smaller shareable images without server upload'],
    example: 'Example: upload a 3MB JPG, choose WebP or JPG output, set quality around 0.80, and compare the downloaded size.',
    troubleshooting: ['If the result is still large, reduce dimensions with Image Resizer first.', 'PNG photos often compress better when converted to JPG or WebP.', 'Keep logos/screenshots as PNG when crisp edges matter.'],
    quality: 'A moderate quality value around 0.75–0.85 is usually the best balance for photos.'
  },
  'compress-image-to-20kb': {
    intro: 'This page targets strict exam and form upload limits where users need an image around 20KB quickly.',
    bestFor: ['Exam form photo uploads', 'Small signature/photo requirements', 'Low-size government or education form uploads'],
    example: 'Example: upload a signature image, let the tool reduce quality/dimensions safely, then download the closest practical file under or near 20KB.',
    troubleshooting: ['Very detailed photos may need resizing before they can approach 20KB.', 'Use JPG for photos and signatures on white backgrounds.', 'Always preview the final image before submitting it.'],
    quality: 'The tool avoids endless compression loops and clearly warns when 20KB is not reasonable without making the image too small.'
  },
  'compress-image-to-50kb': {
    intro: '50KB is a common practical limit for profile photos, signatures, and document images on online forms.',
    bestFor: ['Profile photo uploads', 'Application form images', 'Reducing mobile photos for faster upload'],
    example: 'Example: upload a 700KB JPG, keep max width around 1600px, and download a smaller file near the 50KB target.',
    troubleshooting: ['For portraits, crop unnecessary background before compression.', 'Use 100KB instead if the image becomes visibly poor.', 'If transparency matters, use PNG/WebP tools separately.'],
    quality: 'Target-size compression is approximate because different images compress differently.'
  },
  'passport-photo-resizer': {
    intro: 'Passport Photo Resizer helps users create common application photo dimensions without opening photo-editing software.',
    bestFor: ['3.5cm × 4.5cm style document photos', 'Square 200×200 or 600×600 profile photos', 'Application-ready photo resizing'],
    example: 'Example: upload a portrait photo, choose 3.5cm × 4.5cm, crop to fill, and download a JPG for form upload.',
    troubleshooting: ['Start with a clear front-facing photo.', 'Use fit with white background if cropping cuts the head.', 'Compress the result if the portal also has a KB limit.'],
    quality: 'This tool handles sizing only; official passport requirements such as background, face position, and clothing rules still depend on the issuing authority.'
  },
  'signature-resizer': {
    intro: 'Signature Resizer focuses on the common online-form problem: a scanned signature must fit exact width, height, and sometimes KB limits.',
    bestFor: ['Exam application signatures', 'Job form signature uploads', 'Bank or document signature image resizing'],
    example: 'Example: upload a signature image, set 300×100px, optionally target 20KB, and download a clean JPG.',
    troubleshooting: ['Use a clear dark signature on white paper.', 'Crop blank space around the signature before resizing if needed.', 'If the signature becomes blurry, use a larger dimension and lower compression.'],
    quality: 'For signatures, clear contrast matters more than high resolution.'
  },
  'json-formatter': {
    intro: 'JSON Formatter is designed for developers who need fast local formatting, validation, and copying without sending data to a server.',
    bestFor: ['Reading API responses', 'Debugging config files', 'Finding JSON syntax errors quickly'],
    example: 'Example: paste minified API JSON, choose 2-space indentation, and copy a readable formatted version.',
    troubleshooting: ['If validation fails, check commas, quotes, and trailing commas.', 'JSON keys and strings must use double quotes.', 'Very large JSON may be easier to inspect in smaller chunks.'],
    quality: 'The tool uses browser JSON parsing, so error messages reflect standard JavaScript JSON syntax rules.'
  },
  'word-counter': {
    intro: 'Word Counter is for writing, editing, SEO drafts, academic text, and social content where live counts matter.',
    bestFor: ['Checking essay length', 'Estimating reading time', 'Counting words and characters before submission'],
    example: 'Example: paste an article draft and instantly see words, characters, lines, sentences, and estimated reading time.',
    troubleshooting: ['Remove pasted formatting if counts look unexpected.', 'Use Character Counter for strict social media limits.', 'Reading time is an estimate based on average reading speed.'],
    quality: 'Counts update locally in the browser without uploading your text.'
  },
  'age-calculator': {
    intro: 'Age Calculator gives exact age breakdowns for forms, eligibility checks, birthdays, and date-of-birth calculations.',
    bestFor: ['Age by date of birth', 'School or exam eligibility checks', 'Finding total days lived'],
    example: 'Example: enter date of birth and today’s date to get years, months, days, and total days.',
    troubleshooting: ['Make sure the target date is after date of birth.', 'Use the required official cut-off date for eligibility checks.', 'Different institutions may define age rules differently.'],
    quality: 'The calculator separates years, months, and days instead of showing only a rough decimal age.'
  },
  'gst-calculator': {
    intro: 'GST Calculator is optimized for India-style inclusive and exclusive tax calculations.',
    bestFor: ['Adding GST to a base amount', 'Removing GST from an inclusive amount', 'Checking 5%, 12%, 18%, and 28% tax scenarios'],
    example: 'Example: enter ₹1000 and 18% to see the GST amount and total price including tax.',
    troubleshooting: ['Use “Remove GST” when the price already includes tax.', 'Check the official GST rate for the product/service.', 'Round final invoices according to your accounting rules.'],
    quality: 'The page shows both tax amount and base/total amount to reduce billing mistakes.'
  },
  'qr-code-generator': {
    intro: 'QR Code Generator creates static QR codes locally for URLs, plain text, contact notes, menus, posters, and business sharing.',
    bestFor: ['Website URL QR codes', 'Printable posters and flyers', 'Simple static text QR codes'],
    example: 'Example: paste a business URL, choose a high size, set brand colors, and download PNG for web or SVG for print.',
    troubleshooting: ['Use high error correction for printed QR codes.', 'Test the QR code with a phone before printing.', 'Keep enough contrast between foreground and background colors.'],
    quality: 'SVG export is best for print because it stays sharp at any size.'
  },
  'password-generator': {
    intro: 'Password Generator uses browser crypto randomness to create strong passwords without sending them to a server.',
    bestFor: ['Creating account passwords', 'Generating temporary admin passwords', 'Making multiple random passwords at once'],
    example: 'Example: choose 18 characters, include symbols, generate 5 passwords, and copy one into your password manager.',
    troubleshooting: ['Use longer passwords for important accounts.', 'Store generated passwords in a trusted password manager.', 'Do not reuse the same password across accounts.'],
    quality: 'The tool uses browser cryptographic randomness where supported.'
  }
};

export const workflowPages = [
  {
    slug: 'prepare-documents-for-online-forms',
    title: 'Prepare Documents for Online Forms — Free Browser Workflow | FreeToolCo',
    h1: 'Prepare Documents for Online Forms',
    description: 'Resize photos, compress signatures, convert images to PDF, merge documents, and prepare upload-ready files for online forms.',
    intro: 'Online forms often reject files because the format, dimensions, page order, or file size is wrong. This workflow combines the most useful FreeToolCo tools for application, exam, job, and document-upload portals.',
    steps: ['Resize or compress photos before upload.', 'Resize signature images to the required dimensions.', 'Convert JPG/PNG documents into a PDF when the portal asks for PDF.', 'Merge multiple PDFs into the exact required order.', 'Check the final file before submitting the form.'],
    tools: ['compress-image-to-20kb', 'compress-image-to-50kb', 'passport-photo-resizer', 'signature-resizer', 'jpg-to-pdf', 'merge-pdf', 'compress-pdf'],
    faqs: [['Can this guarantee a portal will accept my file?', 'No. Every portal has its own rules. Use the workflow to match the stated format, size, and dimensions as closely as possible.'], ['Should I resize or compress first?', 'Resize first when dimensions are too large, then compress if there is still a KB limit.']]
  },
  {
    slug: 'compress-image-for-online-form',
    title: 'Compress Image for Online Form Upload | FreeToolCo',
    h1: 'Compress Image for Online Form Upload',
    description: 'Use FreeToolCo image tools to resize and compress photos or signatures for online form upload limits like 20KB, 50KB, and 100KB.',
    intro: 'Many education, government, and job portals require small JPG files. This guide gives a practical compression order so users do not destroy image quality unnecessarily.',
    steps: ['Crop unnecessary background.', 'Resize the image to the required pixel dimensions.', 'Use a target KB compressor such as 20KB, 50KB, or 100KB.', 'Open the downloaded image and verify readability.', 'Try a larger target if the result is too blurry.'],
    tools: ['image-resizer', 'crop-image', 'compress-image-to-20kb', 'compress-image-to-50kb', 'compress-image-to-100kb', 'signature-resizer'],
    faqs: [['Why can’t every image become exactly 20KB?', 'Detailed or large images may need heavy downscaling. The tool uses safe limits and warns when the requested size is not reasonable.'], ['Which format is best?', 'JPG is usually best for photos and signatures on a white background.']]
  },
  {
    slug: 'convert-images-to-pdf-workflow',
    title: 'Convert Images to One PDF Workflow | FreeToolCo',
    h1: 'Convert Images to One PDF Workflow',
    description: 'Convert JPG, PNG, and WebP images into one PDF, then organize and optimize the PDF using FreeToolCo browser tools.',
    intro: 'When users scan documents with a phone, they often end up with many image files. This workflow turns them into a single cleaner PDF.',
    steps: ['Rename or select images in the correct order.', 'Use Image to PDF or JPG to PDF.', 'Choose A4 for document-style output.', 'Use Merge PDF if you need to combine with another PDF.', 'Use basic PDF optimization if the output is too large.'],
    tools: ['image-to-pdf', 'jpg-to-pdf', 'png-to-pdf', 'merge-pdf', 'reorder-pdf-pages', 'compress-pdf'],
    faqs: [['Will the image order be preserved?', 'The PDF follows the order given to the tool. Check the file list before downloading.'], ['Can I combine images and existing PDFs?', 'Convert the images to PDF first, then use Merge PDF.']]
  },
  {
    slug: 'organize-pdf-pages-workflow',
    title: 'Organize PDF Pages Online — Reorder, Delete, Rotate | FreeToolCo',
    h1: 'Organize PDF Pages Online',
    description: 'Reorder, delete, extract, rotate, number, and watermark PDF pages online using FreeToolCo document tools.',
    intro: 'PDF page organization is a common document-cleanup task. This workflow links the page-level tools needed before sharing or uploading a PDF.',
    steps: ['Count or preview the PDF pages if needed.', 'Delete unwanted pages.', 'Rotate sideways scanned pages.', 'Reorder pages into the required sequence.', 'Add page numbers or watermark if needed.'],
    tools: ['pdf-page-counter', 'delete-pdf-pages', 'rotate-pdf', 'reorder-pdf-pages', 'extract-pdf-pages', 'add-page-numbers-pdf', 'watermark-pdf'],
    faqs: [['Can I edit text inside the PDF?', 'This workflow is for page-level organization, not full text editing.'], ['Can I reorder pages by dragging thumbnails?', 'The current browser tool uses typed page order for reliable output.']]
  },
  {
    slug: 'optimize-images-for-website',
    title: 'Optimize Images for Website Speed | FreeToolCo',
    h1: 'Optimize Images for Website Speed',
    description: 'Resize, compress, convert, and create favicons from images for faster websites and cleaner uploads.',
    intro: 'Website images should be smaller than raw camera photos. This workflow helps reduce dimensions, choose modern formats, and export favicons.',
    steps: ['Resize large images to the display size needed on the page.', 'Compress JPG/WebP output with a balanced quality value.', 'Convert PNG photos to WebP or JPG when transparency is not needed.', 'Keep screenshots/logos in PNG when sharp edges matter.', 'Generate favicons from a clean square source image.'],
    tools: ['image-resizer', 'image-compressor', 'jpg-to-webp', 'png-to-webp', 'png-to-jpg', 'favicon-generator'],
    faqs: [['Should I use WebP?', 'WebP is usually smaller for websites and works in modern browsers.'], ['Should I resize before compressing?', 'Yes, resizing first usually gives better results.']]
  },
  {
    slug: 'clean-and-format-json-data',
    title: 'Clean and Format JSON Data Online | FreeToolCo',
    h1: 'Clean and Format JSON Data Online',
    description: 'Format, validate, minify, and convert JSON/CSV data locally in your browser with FreeToolCo developer tools.',
    intro: 'Developers often need to inspect API output, fix malformed JSON, or convert table data. This workflow groups the data tools in one place.',
    steps: ['Paste JSON into JSON Formatter to validate it.', 'Use JSON Minifier when sending compact data.', 'Convert CSV to JSON when moving spreadsheet data into an app.', 'Convert JSON to CSV when preparing spreadsheet exports.', 'Use Base64 or URL tools only when encoding is required.'],
    tools: ['json-formatter', 'json-validator', 'json-minifier', 'csv-to-json', 'json-to-csv', 'base64-encoder-decoder', 'url-encoder-decoder'],
    faqs: [['Is my data uploaded?', 'These developer tools run locally in your browser.'], ['Why is my JSON invalid?', 'Common causes include trailing commas, unquoted keys, and single quotes.']]
  },
  {
    slug: 'create-qr-code-for-business',
    title: 'Create QR Code for Business Cards, Menus & Flyers | FreeToolCo',
    h1: 'Create QR Code for Business',
    description: 'Create static QR codes for websites, menus, flyers, posters, and business cards using FreeToolCo QR tools.',
    intro: 'A business QR code should be high contrast, easy to scan, and tested before printing. This workflow gives a safe path for creating static QR codes.',
    steps: ['Paste the final URL or text.', 'Choose high error correction for print.', 'Use dark foreground and light background.', 'Download SVG for print or PNG for digital use.', 'Test with multiple phone cameras before publishing.'],
    tools: ['qr-code-generator', 'url-encoder-decoder', 'image-resizer'],
    faqs: [['Are these dynamic QR codes?', 'No. This workflow creates static QR codes. Dynamic tracking requires a backend service.'], ['Which download format is best?', 'SVG is best for print; PNG is convenient for websites and messages.']]
  }
];
