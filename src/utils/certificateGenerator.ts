import jsPDF from 'jspdf';

// Define the interface for the data passed to the generator
export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateId: string;
  instructorName: string; // e.g. "OurSaviour (institution)" or "UncleJohn (tutor)"
  verificationUrl?: string;
  institutionSignatureUrl?: string;
  institutionSignerName?: string;
  institutionSignerPosition?: string;
  institutionLogoUrl?: string;
  // Optional fallbacks
  first_name?: string;
  last_name?: string;
  username?: string;
}

// --- Helper: Load Image ---
const loadImage = async (url: string): Promise<HTMLImageElement> => {
  if (!url) throw new Error('Image URL is required');
  
  // For localhost or data URLs, try direct load first
  if (url.startsWith('data:') || url.includes('localhost') || url.includes('127.0.0.1')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.warn(`Direct load failed for ${url}, trying fetch...`);
        reject(e);
      };
      img.src = url;
      // Set timeout in case onload/onerror never fire
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image load timeout'));
        }
      }, 5000);
    }).catch(() => {
      // Fallback to fetch for localhost URLs
      return fetchImageAsBlob(url);
    });
  }
  
  // For external URLs (Cloudinary), use fetch-as-blob
  return fetchImageAsBlob(url);
};

const fetchImageAsBlob = async (url: string): Promise<HTMLImageElement> => {
  try {
    const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const blob = await resp.blob();
    if (blob.size === 0) throw new Error('Empty blob');
    
    const blobUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.warn(`Blob image load failed for ${url}:`, e);
        reject(e);
      };
      img.src = blobUrl;
      // Set timeout
      setTimeout(() => {
        if (!img.complete) reject(new Error('Blob image load timeout'));
      }, 5000);
    });
  } catch (err) {
    console.warn(`Fetch failed for ${url}:`, err);
    // Last resort: direct image load
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
      setTimeout(() => {
        if (!img.complete) reject(new Error('Direct load timeout'));
      }, 5000);
    });
  }
};

// --- Helper: Fetch Platform Signature ---
const loadSignatureImage = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      const apiUrl = (import.meta.env as any).VITE_API_BASE?.replace('/api', '') || 'http://localhost:8000';
      img.src = `${apiUrl}/api/signature/?t=${Date.now()}`;
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load signature'));
    });
};

// --- Colors ---
const GOLD: [number, number, number] = [212, 175, 55];
const BLACK: [number, number, number] = [0, 0, 0];
const DARK_GRAY: [number, number, number] = [60, 60, 60];
const MID_GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const WHITE: [number, number, number] = [255, 255, 255];
const GOLD_LIGHT: [number, number, number] = [245, 230, 180];

// --- Helper: Draw Corner Ornaments (Gold Triangles) ---
const drawCornerOrnaments = (doc: jsPDF, width: number, height: number) => {
  const m = 5; // margin from edge
  const sz = 30; // triangle size

  doc.setFillColor(...GOLD);

  // Top-left triangle
  doc.triangle(m, m, m + sz, m, m, m + sz, 'F');

  // Top-right triangle
  doc.triangle(width - m, m, width - m - sz, m, width - m, m + sz, 'F');

  // Bottom-left triangle
  doc.triangle(m, height - m, m + sz, height - m, m, height - m - sz, 'F');

  // Bottom-right triangle
  doc.triangle(width - m, height - m, width - m - sz, height - m, width - m, height - m - sz, 'F');
};

// --- Helper: Draw Circular Seal ---
const drawCertSeal = (doc: jsPDF, x: number, y: number) => {
  // Outer gold circle
  doc.setFillColor(...GOLD);
  doc.circle(x, y, 14, 'F');

  // Inner dark circle
  doc.setFillColor(30, 30, 30);
  doc.circle(x, y, 10.5, 'F');

  // Inner gold ring
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.circle(x, y, 8, 'S');

  // "L" text in center
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...GOLD);
  doc.text('L', x, y + 2, { align: 'center' });

  // Small text below
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.5);
  doc.setTextColor(...WHITE);
  doc.text('ACADEMY', x, y + 6, { align: 'center' });
};

// --- Helper: Draw decorative watermark lightbulbs ---
const drawWatermarks = (doc: jsPDF, width: number, height: number) => {
  // Faint gold circles on right side (lightbulb approximation)
  doc.setDrawColor(230, 210, 140);
  doc.setLineWidth(0.3);
  
  // Large circle, right side, vertically centered
  const cx = width - 50;
  const cy = height / 2 + 5;
  
  doc.setFillColor(252, 248, 230);
  doc.circle(cx, cy, 22, 'F');
  doc.setDrawColor(240, 220, 150);
  doc.circle(cx, cy, 22, 'S');
  
  // Small lightbulb icon (simplified) inside the circle
  doc.setFillColor(240, 220, 150);
  doc.circle(cx, cy - 4, 6, 'F');
  doc.setFillColor(252, 248, 230);
  doc.circle(cx, cy - 4, 4.5, 'F');
  
  // Lightbulb filament lines
  doc.setDrawColor(220, 200, 120);
  doc.setLineWidth(0.4);
  doc.line(cx - 2, cy + 2, cx - 2, cy + 7);
  doc.line(cx + 2, cy + 2, cx + 2, cy + 7);
  doc.line(cx - 2, cy + 7, cx + 2, cy + 7);

  // Bottom-right smaller circle watermark
  const cx2 = width - 30;
  const cy2 = height - 45;
  doc.setFillColor(252, 248, 230);
  doc.circle(cx2, cy2, 12, 'F');
  doc.setDrawColor(240, 220, 150);
  doc.circle(cx2, cy2, 12, 'S');
};

export const generateCertificate = async (data: CertificateData): Promise<Blob> => {
  // 1. Create PDF (Landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 297mm
  const height = doc.internal.pageSize.getHeight(); // 210mm
  const centerX = width / 2;

  // --- 2. Parse Institution Name ---
  let institutionName: string | null = null;
  if (data.instructorName && data.instructorName.toLowerCase().includes('(institution)')) {
    institutionName = data.instructorName.replace(/\(institution\)/i, '').trim();
    institutionName = institutionName.replace(/_/g, ' ');
  }

  // --- 3. Background ---
  // White base
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, width, height, 'F');

  // Subtle cream inner area
  doc.setFillColor(253, 251, 245);
  doc.rect(8, 8, width - 16, height - 16, 'F');

  // --- 4. Borders ---
  // Outer black border
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(2.5);
  doc.rect(5, 5, width - 10, height - 10);

  // Inner gold border
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.rect(10, 10, width - 20, height - 20);

  // Second inner gold border (thin)
  doc.setLineWidth(0.3);
  doc.rect(13, 13, width - 26, height - 26);

  // --- 5. Corner Ornaments ---
  drawCornerOrnaments(doc, width, height);

  // --- 6. Watermark Elements ---
  drawWatermarks(doc, width, height);

  // --- 7. Header: Logo & Academy Name ---
  let headerY = 30;

  // If institution has a logo, show it; otherwise show default branding
  if (data.institutionLogoUrl) {
    try {
      const logoImg = await loadImage(data.institutionLogoUrl);
      const maxLogoH = 18;
      const logoW = (logoImg.width / logoImg.height) * maxLogoH;
      doc.addImage(logoImg, 'PNG', centerX - logoW / 2, headerY - 12, logoW, maxLogoH);
      headerY += 12;
    } catch (e) {
      console.warn('Failed to load institution logo for header', e);
    }
  }

  // Academy name or institution name
  const brandName = institutionName
    ? institutionName.toUpperCase()
    : 'LIGHT HUB';
  const brandSub = institutionName ? '' : 'A C A D E M Y';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text(brandName, centerX, headerY, { align: 'center' });

  if (brandSub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text(brandSub, centerX, headerY + 7, { align: 'center' });
    headerY += 7;
  }

  // Gold separator line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(centerX - 50, headerY + 6, centerX + 50, headerY + 6);

  // --- 8. "THIS IS TO CERTIFY THAT" ---
  let currentY = headerY + 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MID_GRAY);
  doc.text('THIS IS TO CERTIFY THAT', centerX, currentY, { align: 'center' });

  currentY += 14;

  // --- 9. Student Name (script/cursive approximation) ---
  const fn = (data.first_name || (data as any).firstName || '').toString().trim();
  const ln = (data.last_name || (data as any).lastName || '').toString().trim();
  let studentDisplayName = '';
  if (fn || ln) {
    studentDisplayName = [fn, ln].filter(Boolean).join(' ');
  } else if (data.studentName && data.studentName.toString().trim()) {
    studentDisplayName = data.studentName.toString();
  } else if (data.username && data.username.toString().trim()) {
    studentDisplayName = data.username.toString();
  } else {
    studentDisplayName = 'Student';
  }

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(36);
  doc.setTextColor(...DARK_GRAY);
  doc.text(studentDisplayName, centerX, currentY, { align: 'center' });

  // Gold underline below name
  const nameWidth = Math.min(doc.getTextWidth(studentDisplayName), width - 80);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(centerX - nameWidth / 2, currentY + 3, centerX + nameWidth / 2, currentY + 3);

  currentY += 14;

  // --- 10. "has successfully completed the training program in" ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MID_GRAY);
  doc.text('has successfully completed the training program in', centerX, currentY, { align: 'center' });

  currentY += 12;

  // --- 11. Course Title ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BLACK);
  const splitTitle = doc.splitTextToSize(`[${data.courseTitle.toUpperCase()}]`, width - 80);
  doc.text(splitTitle, centerX, currentY, { align: 'center' });

  currentY += (splitTitle.length * 8) + 4;

  // --- 12. "conducted by ..." ---
  const conductedBy = institutionName
    ? `conducted by ${institutionName}`
    : 'conducted by Light Hub Academy.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MID_GRAY);
  doc.text(conductedBy, centerX, currentY, { align: 'center' });

  currentY += 10;

  // --- 13. Description paragraph ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  const descText = 'This training has equipped the recipient with the knowledge\nand skills necessary to excel in this field.';
  doc.text(descText, centerX, currentY, { align: 'center' });

  // --- 14. Footer Section: DATE — SEAL — SIGNATURE ---
  const footerY = height - 42;

  // Check for dual signature mode
  const hasInstSig = data.institutionSignatureUrl && data.institutionSignerName;

  // === LEFT SIDE: DATE ===
  const leftX = 45;

  // Date value
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_GRAY);
  doc.text(data.completionDate, leftX, footerY + 2, { align: 'center' });

  // Line under date
  doc.setDrawColor(...MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(leftX - 25, footerY + 5, leftX + 25, footerY + 5);

  // "DATE" label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GRAY);
  doc.text('DATE', leftX, footerY + 10, { align: 'center' });

  // === CENTER: SEAL ===
  drawCertSeal(doc, centerX, footerY + 2);

  // === RIGHT SIDE: SIGNATURE(S) ===
  if (hasInstSig) {
    // --- DUAL SIGNATURE MODE ---
    // Platform CEO signature on left-center area
    const sigLeftX = centerX - 55;

    try {
      const sigImg = await loadSignatureImage().catch(() => null);
      if (sigImg) {
        const sigW = 35;
        const sigH = (sigImg.height / sigImg.width) * sigW;
        doc.addImage(sigImg, 'PNG', sigLeftX - sigW / 2, footerY - 14, sigW, sigH);
      }
    } catch (e) {
      console.warn('Platform signature load failed', e);
    }

    doc.setDrawColor(...MID_GRAY);
    doc.setLineWidth(0.3);
    doc.line(sigLeftX - 20, footerY + 5, sigLeftX + 20, footerY + 5);

    // Fetch platform signer info
    let platformNameLine = 'Ndubuisi Osinachi Blessed';
    let platformTitleLine = 'CEO, LightHub Academy';
    try {
      const apiUrl = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/admin/signature/`);
      if (res.ok) {
        const json = await res.json();
        if (json.signer_name) {
          const parts = json.signer_name.split(',').map((s: string) => s.trim());
          if (parts.length >= 2) {
            platformNameLine = parts.slice(0, parts.length - 1).join(', ');
            platformTitleLine = parts.slice(parts.length - 1).join(', ');
          } else {
            platformNameLine = json.signer_name;
          }
        }
      }
    } catch (e) { /* ignore */ }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GRAY);
    doc.text(platformNameLine, sigLeftX, footerY + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GRAY);
    doc.text(platformTitleLine, sigLeftX, footerY + 14, { align: 'center' });

    // Institution signature on right side
    const sigRightX = centerX + 55;

    try {
      const instSigImg = await loadImage(data.institutionSignatureUrl!).catch(() => null);
      if (instSigImg) {
        const sigW = 35;
        const sigH = (instSigImg.height / instSigImg.width) * sigW;
        doc.addImage(instSigImg, 'PNG', sigRightX - sigW / 2, footerY - 14, sigW, sigH);
      }
    } catch (e) {
      console.warn('Institution signature load failed', e);
    }

    doc.setDrawColor(...MID_GRAY);
    doc.setLineWidth(0.3);
    doc.line(sigRightX - 20, footerY + 5, sigRightX + 20, footerY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GRAY);
    doc.text(data.institutionSignerName!, sigRightX, footerY + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GRAY);
    const posText = data.institutionSignerPosition || 'Authorized Signature';
    doc.text(posText, sigRightX, footerY + 14, { align: 'center' });

  } else {
    // --- SINGLE SIGNATURE MODE ---
    const rightX = width - 55;

    // Load and draw platform signature
    try {
      const sigImg = await loadSignatureImage().catch(() => null);
      if (sigImg) {
        const sigW = 40;
        const sigH = (sigImg.height / sigImg.width) * sigW;
        doc.addImage(sigImg, 'PNG', rightX - sigW / 2, footerY - 14, sigW, sigH);
      }
    } catch (e) {
      console.warn('Signature load failed', e);
    }

    // Line under signature
    doc.setDrawColor(...MID_GRAY);
    doc.setLineWidth(0.3);
    doc.line(rightX - 25, footerY + 5, rightX + 25, footerY + 5);

    // "SIGNATURE" label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GRAY);
    doc.text('SIGNATURE', rightX, footerY + 10, { align: 'center' });

    // Fetch and display platform signer name
    let platformNameLine = 'Ndubuisi Osinachi Blessed';
    let platformTitleLine = 'CEO, LightHub Academy';
    try {
      const apiUrl = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/admin/signature/`);
      if (res.ok) {
        const json = await res.json();
        if (json.signer_name) {
          const parts = json.signer_name.split(',').map((s: string) => s.trim());
          if (parts.length >= 2) {
            platformNameLine = parts.slice(0, parts.length - 1).join(', ');
            platformTitleLine = parts.slice(parts.length - 1).join(', ');
          } else {
            platformNameLine = json.signer_name;
          }
        }
      }
    } catch (e) { /* ignore */ }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GRAY);
    doc.text(platformNameLine, rightX, footerY + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GRAY);
    doc.text(platformTitleLine, rightX, footerY + 19, { align: 'center' });
  }

  // --- 15. Certificate ID (bottom-left) ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(`CERTIFICATE ID: ${data.certificateId}`, 18, height - 12);

  // --- 16. Verification URL (bottom-right, subtle) ---
  if (data.verificationUrl) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Verify: ${data.verificationUrl}`, width - 18, height - 12, { align: 'right' });
  }

  // Output PDF blob
  return doc.output('blob');
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
    const text = `I just successfully completed the course "${courseName}" on LightHub Academy! 🎓`;
    const url = certificateUrl; 

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
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'native') {
        alert('Sharing not supported on this device/browser. Please copy the link manually.');
    }
};