import jsPDF from 'jspdf';

// Define the interface for the data passed to the generator
export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateId: string;
  instructorName: string; // e.g. "OurSaviour (institution)" or "UncleJohn (tutor)"
  verificationUrl?: string;
}

// --- Helper: Load Image ---
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

// --- Helper: Fetch Platform Signature ---
// This fetches the signature image from your backend API
const loadSignatureImage = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      // Adjust this URL to match your actual backend endpoint for the signature
      // Using a timestamp to prevent caching issues
      const apiUrl = (import.meta.env as any).VITE_API_BASE?.replace('/api', '') || 'http://localhost:8000';
      img.src = `${apiUrl}/api/signature/?t=${Date.now()}`;
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load signature'));
    });
};

export const generateCertificate = async (data: CertificateData): Promise<Blob> => {
  // 1. Create PDF (Landscape A4)
  // A4 Landscape dimensions: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  // --- 2. Logic: Parse Institution vs Tutor ---
  let institutionName: string | null = null;
  // If the string contains "(institution)", extract the name
  if (data.instructorName && data.instructorName.toLowerCase().includes('(institution)')) {
    institutionName = data.instructorName.replace(/\(institution\)/i, '').trim();
    // Sanitize: replace underscores with spaces just in case
    institutionName = institutionName.replace(/_/g, ' ');
  }

  // --- 3. Background & Borders (The "Grand" Look) ---
  
  // Off-white paper background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');
  
  // Guilloche-style Pattern Background (Subtle Grey)
  doc.setFillColor(248, 248, 250); 
  doc.rect(5, 5, width - 10, height - 10, 'F');

  // Main Border: Navy Blue
  doc.setDrawColor(10, 35, 66); // Deep Navy
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  // Inner Border: Gold
  doc.setDrawColor(212, 175, 55); // Metallic Gold
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30);

  // --- 4. Header Section ---

  // Top Right: "COURSE CERTIFICATE"
  // We fix this position first. It takes up about 50-60mm on the right.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74); // Lebanon Green accent
  doc.text('COURSE CERTIFICATE', width - 25, 35, { align: 'right' });

  // Top Left: Institution Name (if applicable) or Platform Name
  doc.setFont('times', 'bold');
  doc.setTextColor(10, 35, 66); // Navy

  let headerText = '';
  if (institutionName) {
    doc.setFontSize(24);
    headerText = institutionName.toUpperCase();
  } else {
    // If no institution, show Lebanon Academy grandly
    doc.setFontSize(20);
    headerText = 'LEBANON ACADEMY';
  }

  // **FIX: WRAP TEXT LOGIC**
  // Ensure the institution name doesn't overlap with the right-side text.
  // Page width is ~297mm. "Course Certificate" ends at 272mm and extends left ~60mm (to ~212mm).
  // We start text at 25mm. 
  // Max width = 212mm - 25mm - 20mm (padding) = ~167mm.
  const maxHeaderWidth = 170; 
  const splitHeaderText = doc.splitTextToSize(headerText, maxHeaderWidth);
  
  doc.text(splitHeaderText, 25, 35, { align: 'left' });

  // --- 5. Main Body ---
  // Adjust starting Y based on how many lines the header took
  let currentY = 80;

  // Completion Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(data.completionDate, centerX, currentY, { align: 'center' });
  currentY += 15;

  // Student Name
  doc.setFont('times', 'bolditalic'); // Grand appearance
  doc.setFontSize(42);
  doc.setTextColor(10, 35, 66); // Navy
  doc.text(data.studentName, centerX, currentY, { align: 'center' });
  
  // Underline Name
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.line(centerX - 60, currentY + 3, centerX + 60, currentY + 3);

  currentY += 15;

  // "Has successfully completed..."
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('has successfully completed the course', centerX, currentY, { align: 'center' });

  currentY += 18;

  // Course Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(0, 0, 0);
  // Wrap course title if too long
  const splitTitle = doc.splitTextToSize(data.courseTitle, width - 80);
  doc.text(splitTitle, centerX, currentY, { align: 'center' });

  // Adjust Y based on title length
  currentY += (splitTitle.length * 10) + 5;

  // Authorization Text
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);

  let authText = '';
  if (institutionName) {
    authText = `an online non-credit course authorized by ${institutionName} and offered through`;
  } else {
    authText = `an online non-credit course offered through`;
  }
  doc.text(authText, centerX, currentY, { align: 'center' });

  currentY += 10;

  // Platform Name (Grand Font)
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74); // Green
  doc.text('Lebanon Academy', centerX, currentY, { align: 'center' });


  // --- 6. Footer & Signatures ---
  const footerY = height - 55;

  // Left Side: Platform CEO Signature (Authenticity)
  try {
    const sigImg = await loadSignatureImage().catch(() => null);
    if (sigImg) {
        // Draw the signature image
        // Aspect ratio calculation
        const sigWidth = 40;
        const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
        doc.addImage(sigImg, 'PNG', 35, footerY - 15, sigWidth, sigHeight);
    }
  } catch (e) {
    console.warn("Signature load failed", e);
  }

  // Signature Line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(35, footerY + 5, 95, footerY + 5);

  // CEO Name & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('Ndubuisi Osinachi Blessed', 35, footerY + 11);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Chief Executive Officer, Lebanon Academy', 35, footerY + 16);


  // Right Side: Excellence Seal & Verify
  // We'll draw a vector seal
  drawGoldSeal(doc, width - 45, footerY - 5);

  const verifyY = height - 15;
  
  // Verification ID
  if (data.verificationUrl) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Verify at:', 20, verifyY);
    
    doc.setTextColor(22, 163, 74); // Green Link
    doc.text(data.verificationUrl, 32, verifyY);
  }

  // Certificate ID
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Certificate ID: ${data.certificateId}`, width - 20, verifyY, { align: 'right' });

  // Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Lebanon Academy has confirmed the identity of this individual and their participation in the course.', 20, verifyY + 5);

  return doc.output('blob');
};


// --- Helper: Draw Gold Seal ---
const drawGoldSeal = (doc: jsPDF, x: number, y: number) => {
    // Outer Circle (Gold)
    doc.setFillColor(212, 175, 55); 
    doc.circle(x, y, 18, 'F');

    // Inner Circle (Navy)
    doc.setFillColor(10, 35, 66);
    doc.circle(x, y, 14, 'F');

    // Star
    doc.setFillColor(255, 255, 255);
    // Simple star drawing logic using lines is complex in raw jspdf without svg
    // We use a text star for reliability and high quality font rendering
    doc.setFont('zapfdingbats'); // Special symbol font usually available
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    
    // If zapfdingbats is weird on some systems, standard unicode star works in most fonts
    doc.setFont('times', 'normal'); 
    doc.text('★', x, y + 4, { align: 'center' }); // Centered star

    // Ribbon tails
    doc.setFillColor(212, 175, 55);
    // Left tail
    doc.triangle(x - 10, y + 15, x - 10, y + 30, x, y + 25, 'F');
    // Right tail
    doc.triangle(x + 10, y + 15, x + 10, y + 30, x, y + 25, 'F');
    
    // Text "EXCELLENCE" inside seal (very small)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(255, 255, 255);
    doc.text('EXCELLENCE', x, y + 9, { align: 'center' });
};


// --- Browser Helpers ---

export const downloadCertificate = (blob: Blob, courseName: string, studentName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate - ${studentName} - ${courseName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

export const shareToSocialMedia = async (platform: string, courseName: string, certificateUrl: string = window.location.href) => {
    const text = `I just successfully completed the course "${courseName}" on Lebanon Academy! 🎓`;
    const url = certificateUrl; // Or specific verify URL

    // Use Native Share API if on mobile and requested
    if (platform === 'native' && navigator.share) {
        try {
            await navigator.share({
                title: 'My Certificate',
                text: text,
                url: url,
            });
            return;
        } catch (err) {
            console.error('Error sharing:', err);
        }
    }

    // Fallback for Web/Desktop
    let shareUrl = '';
    switch (platform) {
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        default:
            // Default to twitter if unknown string passed or just alert
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } else {
        // If native share failed or not supported and no specific platform
        if (platform === 'native') {
             alert('Sharing not supported on this device/browser. Please copy the link manually.');
        }
    }
};