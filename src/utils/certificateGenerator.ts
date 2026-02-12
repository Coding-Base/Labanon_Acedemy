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
  institutionSignerPosition?: string; // <--- Added this new field
  institutionLogoUrl?: string; // <--- URL to institution logo
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

// --- Helper: Draw Gold Seal ---
const drawGoldSeal = (doc: jsPDF, x: number, y: number) => {
    // Outer Circle (Gold)
    doc.setFillColor(212, 175, 55); 
    doc.circle(x, y, 16, 'F'); 

    // Inner Circle (Navy)
    doc.setFillColor(10, 35, 66);
    doc.circle(x, y, 12, 'F'); 

    // Star
    doc.setFillColor(255, 255, 255);
    doc.setFontSize(20);
    
    try {
        doc.setFont('zapfdingbats');
        doc.text('★', x, y + 3, { align: 'center' }); 
    } catch(e) {
        doc.setFont('times', 'bold'); 
        doc.text('*', x, y + 4, { align: 'center' }); 
    }

    // Ribbon tails
    doc.setFillColor(212, 175, 55);
    // Left tail
    doc.triangle(x - 8, y + 12, x - 8, y + 25, x, y + 20, 'F');
    // Right tail
    doc.triangle(x + 8, y + 12, x + 8, y + 25, x, y + 20, 'F');
    
    // Text "EXCELLENCE" inside seal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255);
    doc.text('EXCELLENCE', x, y + 8, { align: 'center' });
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

  // --- 2. Logic: Parse Institution Name ---
  let institutionName: string | null = null;
  if (data.instructorName && data.instructorName.toLowerCase().includes('(institution)')) {
    institutionName = data.instructorName.replace(/\(institution\)/i, '').trim();
    institutionName = institutionName.replace(/_/g, ' ');
  }

  // --- 3. Background & Borders ---
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');
  
  doc.setFillColor(248, 248, 250); 
  doc.rect(5, 5, width - 10, height - 10, 'F');

  doc.setDrawColor(10, 35, 66); // Navy
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30);

  // --- 4. Header Section ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74); 
  doc.text('COURSE CERTIFICATE', width - 25, 35, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setTextColor(10, 35, 66); 

  let headerText = 'LightHub Academy';
  if (institutionName) {
    doc.setFontSize(24);
    headerText = institutionName.toUpperCase();
  } else {
    doc.setFontSize(20);
  }

  const maxHeaderWidth = 170; 
  const splitHeaderText = doc.splitTextToSize(headerText, maxHeaderWidth);
  doc.text(splitHeaderText, 25, 35, { align: 'left' });

  // --- 5. Main Body ---
  let currentY = 80;

  // Completion Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(data.completionDate, centerX, currentY, { align: 'center' });
  currentY += 15;

  // Student Name: prefer first + last name, fall back to studentName or username
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
  doc.setFontSize(42);
  doc.setTextColor(10, 35, 66);
  doc.text(studentDisplayName, centerX, currentY, { align: 'center' });
  
  doc.setDrawColor(212, 175, 55);
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
  const splitTitle = doc.splitTextToSize(data.courseTitle, width - 80);
  doc.text(splitTitle, centerX, currentY, { align: 'center' });

  currentY += (splitTitle.length * 10) + 5;

  // Authorization Text
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);

  let authText = `an online non-credit course offered through`;
  if (institutionName) {
    authText = `an online non-credit course authorized by ${institutionName} and offered through`;
  }
  doc.text(authText, centerX, currentY, { align: 'center' });

  currentY += 10;

  // Platform Name
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text('LightHub Academy', centerX, currentY, { align: 'center' });

  // --- 6. Footer & Signatures ---
  
  // Adjusted footerY to prevent seal overlapping text
  const footerY = height - 35;

  // --- LEFT SIDE: Platform CEO ---
  try {
    const sigImg = await loadSignatureImage().catch(() => null);
    if (sigImg) {
        const sigWidth = 40;
        const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
        doc.addImage(sigImg, 'PNG', 35, footerY - 15, sigWidth, sigHeight);
    }
  } catch (e) {
    console.warn("Signature load failed", e);
  }

  // Line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(35, footerY + 5, 95, footerY + 5);

  // Name & Title - attempt to fetch platform signer name from API
  let platformSignerRaw: string | null = null;
  try {
    const apiUrl = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'
    const res = await fetch(`${apiUrl}/admin/signature/`)
    if (res.ok) {
      const json = await res.json()
      platformSignerRaw = json.signer_name || null
    }
  } catch (e) {
    // ignore and fallback to defaults
  }

  let platformNameLine = 'Ndubuisi Osinachi Blessed'
  let platformTitleLine = 'CEO, LightHub Academy'
  if (platformSignerRaw) {
    const parts = platformSignerRaw.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      platformNameLine = parts.slice(0, parts.length - 1).join(', ')
      platformTitleLine = parts.slice(parts.length - 1).join(', ')
    } else {
      platformNameLine = platformSignerRaw
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(platformNameLine, 35, footerY + 11);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(platformTitleLine, 35, footerY + 16);


  // --- RIGHT SIDE & SEAL PLACEMENT ---
  const hasInstSig = data.institutionSignatureUrl && data.institutionSignerName;

  // Institution Logo handling: right side, under "COURSE CERTIFICATE" text
  if (data.institutionLogoUrl) {
    try {
      const logoImg = await loadImage(data.institutionLogoUrl);
      const maxLogoWidth = 20; // 20mm width
      const logoHeight = (logoImg.height / logoImg.width) * maxLogoWidth;
      // Position on right side, below header
      doc.addImage(logoImg, 'PNG', width - maxLogoWidth - 40, 35, maxLogoWidth, logoHeight);
    } catch (e) {
      console.warn('Failed to load institution logo', e);
    }
  }

  if (hasInstSig) {
    // === DUAL SIGNATURE MODE ===
    
    // 1. Draw Institution Signature on Right
    try {
      const instSigImg = await loadImage(data.institutionSignatureUrl!).catch(() => null);
      if (instSigImg) {
        const sigWidth = 40;
        const sigHeight = (instSigImg.height / instSigImg.width) * sigWidth;
        doc.addImage(instSigImg, 'PNG', width - 95, footerY - 15, sigWidth, sigHeight);
      }
    } catch (e) { console.warn("Inst signature load failed"); }

    // Line
    doc.setDrawColor(100, 100, 100);
    doc.line(width - 95, footerY + 5, width - 35, footerY + 5);

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(data.institutionSignerName!, width - 95, footerY + 11);
    
    // Title / Position (Wired Up)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    // Use dynamic position field if available
    const positionText = data.institutionSignerPosition || 'Authorized Signature';
    doc.text(positionText, width - 95, footerY + 16);

    // 2. Draw Seal in CENTER (Balanced)
    // Positioned at footerY + 10 to be clear of text
    drawGoldSeal(doc, centerX, footerY + 10);

  } else {
    // === SINGLE SIGNATURE MODE ===
    // Draw Seal on RIGHT
    drawGoldSeal(doc, width - 45, footerY);
  }

  // --- 7. Verification Metadata ---
  const verifyY = height - 12;
  
  if (data.verificationUrl) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Verify at:', 20, verifyY);
    doc.setTextColor(22, 163, 74);
    doc.textWithLink(data.verificationUrl, 32, verifyY, { url: data.verificationUrl });
  }

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Certificate ID: ${data.certificateId}`, width - 20, verifyY, { align: 'right' });

  // Output PDF blob (blob URLs will remain valid during and after rendering)
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