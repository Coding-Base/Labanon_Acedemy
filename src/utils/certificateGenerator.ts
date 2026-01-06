/**
 * Premium Certificate Generator Utility
 * Generates stunning, professionally styled PNG certificates using Canvas API
 * Classic design with bold, clearly visible signatures
 */

interface CertificateData {
  courseName: string;
  username: string;
  completionDate: Date;
  courseId: number;
  logoUrl?: string;
}

/**
 * Generate an exquisite, classic certificate as PNG blob
 * Features:
 * - Regal color scheme with deep navy and gold accents
 * - Professional embossed borders with decorative filigree
 * - Extremely large, bold signature with clear visibility
 * - Platform logo in a prestigious medallion
 * - Elegant, timeless typography
 * - Museum-quality design suitable for framing
 */
export async function generateCertificate(data: CertificateData): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create canvas with landscape A4 aspect ratio (11.7 x 8.3 inches at 300 DPI)
      const canvas = document.createElement('canvas');
      const width = 2480; // 11.7 inches at 300 DPI
      const height = 1754; // 8.3 inches at 300 DPI
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Load images with improved error handling
      let signatureImg: HTMLImageElement | null = null;
      let logoImg: HTMLImageElement | null = null;
      
      try {
        signatureImg = await loadSignatureImage();
      } catch (err) {
        console.warn('Failed to load signature image, using fallback', err);
      }
      
      try {
        logoImg = await loadLogoImage();
      } catch (err) {
        console.warn('Failed to load logo image, using fallback', err);
      }

      // === PREMIUM CLASSIC BACKGROUND ===
      // Ivory parchment texture with subtle gradient
      ctx.fillStyle = '#fefcf6';
      ctx.fillRect(0, 0, width, height);

      // Add subtle paper texture
      addPaperTexture(ctx, width, height);

      // === ELEGANT BORDER SYSTEM ===
      // 1. Outer embossed border (deep navy)
      const borderWidth = 40;
      drawEmbossedBorder(ctx, width, height, borderWidth, '#0a2342');

      // 2. Gold filigree border pattern
      drawFiligreeBorder(ctx, width, height, borderWidth + 20);

      // 3. Inner thin gold line
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        borderWidth + 60,
        borderWidth + 60,
        width - (borderWidth + 60) * 2,
        height - (borderWidth + 60) * 2
      );

      // === DECORATIVE CORNER ELEMENTS ===
      drawClassicCorners(ctx, width, height, 120);

      // === TOP BANNER WITH MEDALLION ===
      // Draw elegant top banner
      drawTopBanner(ctx, width);

      // === CENTRAL MEDALLION FOR LOGO ===
      const logoMedallionY = 180;
      if (logoImg) {
        try {
          const medallionRadius = 110;
          const centerX = width / 2;
          
          // Draw gold medallion background
          drawMedallion(ctx, centerX, logoMedallionY, medallionRadius);
          
          // Draw logo inside medallion
          const logoSize = medallionRadius * 1.4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, logoMedallionY, medallionRadius * 0.8, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, centerX - logoSize/2, logoMedallionY - logoSize/2, logoSize, logoSize);
          ctx.restore();
          
          // Add medallion shine
          addMedallionShine(ctx, centerX, logoMedallionY, medallionRadius);
        } catch (err) {
          console.warn('Failed to draw logo in medallion', err);
          drawMedallion(ctx, width / 2, logoMedallionY, 110);
        }
      } else {
        drawMedallion(ctx, width / 2, logoMedallionY, 110);
      }

      // === MAIN TITLE - ELEGANT TYPOGRAPHY ===
      const titleY = 380;
      ctx.save();
      // Shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      
      ctx.font = 'bold 92px "Playfair Display", "Times New Roman", serif';
      ctx.fillStyle = '#0a2342'; // Deep navy
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICATE OF ACHIEVEMENT', width / 2, titleY);
      
      ctx.font = 'italic 72px "Playfair Display", "Times New Roman", serif';
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.fillText('In Recognition of Excellence', width / 2, titleY + 100);
      ctx.restore();

      // Decorative divider under title
      drawDecorativeDivider(ctx, width / 2 - 300, titleY + 140, width / 2 + 300);

      // === AWARD TEXT ===
      ctx.font = 'italic 40px "Crimson Text", "Georgia", serif';
      ctx.fillStyle = '#4a4a4a';
      ctx.textAlign = 'center';
      ctx.fillText('This prestigious certificate is awarded to', width / 2, titleY + 240);

      // === STUDENT NAME - MOST PROMINENT ===
      const studentNameY = titleY + 400;
      ctx.save();
      ctx.shadowColor = 'rgba(10, 35, 66, 0.3)';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 110px "Playfair Display", "Times New Roman", serif';
      ctx.fillStyle = '#0a2342';
      ctx.textAlign = 'center';
      ctx.fillText(data.username.toUpperCase(), width / 2, studentNameY);
      ctx.restore();

      // Gold underline for name
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 600, studentNameY + 40);
      ctx.lineTo(width / 2 + 600, studentNameY + 40);
      ctx.stroke();

      // === ACHIEVEMENT TEXT ===
      ctx.font = '38px "Crimson Text", "Georgia", serif';
      ctx.fillStyle = '#4a4a4a';
      ctx.textAlign = 'center';
      ctx.fillText('for the successful completion of', width / 2, studentNameY + 140);

      // === COURSE NAME ===
      const courseStartY = studentNameY + 240;
      ctx.save();
      ctx.font = 'bold 58px "Playfair Display", "Times New Roman", serif';
      ctx.fillStyle = '#d4af37';
      ctx.textAlign = 'center';
      const courseLines = wrapText(ctx, data.courseName, width - 600, 58);
      let textY = courseStartY;
      courseLines.forEach((line: string) => {
        ctx.fillText(line, width / 2, textY);
        textY += 68;
      });
      ctx.restore();

      // === COMPLETION DATE IN ELEGANT BOX ===
      const formattedDate = data.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Date box background
      const dateBoxY = textY + 80;
      ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
      ctx.fillRect(width / 2 - 250, dateBoxY, 500, 80);
      
      // Date box border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 250, dateBoxY, 500, 80);
      
      ctx.font = 'italic 36px "Crimson Text", "Georgia", serif';
      ctx.fillStyle = '#0a2342';
      ctx.textAlign = 'center';
      ctx.fillText(`Awarded on ${formattedDate}`, width / 2, dateBoxY + 60);

      // === SIGNATURE SECTION - EXTREMELY PROMINENT ===
      const signatureSectionY = dateBoxY + 360;
      
      // Calculate positions for seals
      const leftSealX = 450;
      const rightSealX = width - 450;
      const sealY = signatureSectionY + 60;
      
      // Left Official Seal (Generated)
      drawOfficialSeal(ctx, leftSealX, sealY, 140, 'LEBANON ACADEMY', 'EST. 2023');
      
      // Right Official Seal (Generated)
      drawOfficialSeal(ctx, rightSealX, sealY, 140, 'CERTIFICATE OF EXCELLENCE', 'AUTHENTIC');

      // Signature area with enhanced visibility
      drawSignatureArea(ctx, width, signatureSectionY, signatureImg);

      // === CERTIFICATE ID & AUTHENTICITY ===
      const certId = generateCertificateId();
      
      // Certificate ID box
      ctx.fillStyle = 'rgba(10, 35, 66, 0.05)';
      ctx.fillRect(width / 2 - 200, height - 120, 400, 50);
      
      ctx.font = 'bold 28px "Arial", sans-serif';
      ctx.fillStyle = '#0a2342';
      ctx.textAlign = 'center';
      ctx.fillText(`Certificate ID: ${certId}`, width / 2, height - 85);

      // Authenticity watermark at bottom
      ctx.font = 'italic 24px "Arial", sans-serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText('✓ Authentic Document • Digitally Verified • Official Record', width / 2, height - 30);

      // === FINAL EMBOSSING EFFECT ===
      addEmbossEffect(ctx, width, height);

      // Convert canvas to high-quality PNG blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png', 1.0);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw Official Seal with generated design
 */
function drawOfficialSeal(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, topText: string, bottomText: string) {
  ctx.save();
  
  // Outer ring with gradient
  const outerGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius);
  outerGradient.addColorStop(0, '#f4e4a6');
  outerGradient.addColorStop(1, '#b8860b');
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#0a2342';
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = '#fefcf6';
  ctx.fill();
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();

  // Innermost circle
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.75, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0a2342';
  ctx.stroke();

  // Decorative pattern inside seal
  drawSealPattern(ctx, x, y, radius * 0.7);

  // Top text around the seal
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px "Times New Roman", serif';
  ctx.fillStyle = '#0a2342';
  
  const angle = Math.PI / 180;
  const topRadius = radius * 0.9;
  
  for (let i = 0; i < topText.length; i++) {
    const char = topText[i];
    const charAngle = (i - topText.length / 2) * 0.08;
    
    ctx.save();
    ctx.rotate(charAngle);
    ctx.translate(topRadius, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Bottom text around the seal
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Times New Roman", serif';
  ctx.fillStyle = '#0a2342';
  
  const bottomRadius = radius * 0.9;
  
  for (let i = 0; i < bottomText.length; i++) {
    const char = bottomText[i];
    const charAngle = (i - bottomText.length / 2) * 0.08;
    
    ctx.save();
    ctx.rotate(charAngle);
    ctx.translate(bottomRadius, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Center emblem (star)
  ctx.fillStyle = '#d4af37';
  drawStar(ctx, x, y, 5, radius * 0.35, radius * 0.17);
  
  // Inner circle in center
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#0a2342';
  ctx.fill();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#fefcf6';
  ctx.fill();

  ctx.restore();
}

/**
 * Draw decorative pattern inside seal
 */
function drawSealPattern(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  
  // Draw decorative rings
  const rings = 3;
  for (let i = 0; i < rings; i++) {
    const ringRadius = radius * (0.3 + i * 0.2);
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = i % 2 === 0 ? '#d4af37' : '#0a2342';
    ctx.stroke();
    
    // Add small dots around ring
    const dots = 12;
    for (let j = 0; j < dots; j++) {
      const angle = (j * Math.PI * 2) / dots;
      const dotX = x + ringRadius * Math.cos(angle);
      const dotY = y + ringRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#0a2342' : '#d4af37';
      ctx.fill();
    }
  }
  
  ctx.restore();
}

/**
 * Add subtle paper texture to background
 */
function addPaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const texture = ctx.createLinearGradient(0, 0, width, height);
  texture.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  texture.addColorStop(1, 'rgba(250, 250, 245, 0.9)');
  ctx.fillStyle = texture;
  ctx.fillRect(0, 0, width, height);
  
  // Add very subtle noise
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 3;
    data[i] = Math.min(255, data[i] + noise);
    data[i + 1] = Math.min(255, data[i + 1] + noise);
    data[i + 2] = Math.min(255, data[i + 2] + noise);
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Draw embossed border with classic styling
 */
function drawEmbossedBorder(ctx: CanvasRenderingContext2D, width: number, height: number, borderWidth: number, color: string) {
  ctx.save();
  
  // Outer dark border
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Inner light border (creates embossed effect)
  ctx.fillStyle = '#fefcf6';
  ctx.fillRect(
    borderWidth,
    borderWidth,
    width - borderWidth * 2,
    height - borderWidth * 2
  );
  
  // Bevel effect
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, borderWidth);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.strokeRect(borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth);
  
  ctx.restore();
}

/**
 * Draw decorative filigree border pattern
 */
function drawFiligreeBorder(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number) {
  ctx.save();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  const dashPattern = [15, 8, 3, 8];
  ctx.setLineDash(dashPattern);
  
  // Top border
  ctx.beginPath();
  ctx.moveTo(offset, offset);
  ctx.lineTo(width - offset, offset);
  ctx.stroke();
  
  // Bottom border
  ctx.beginPath();
  ctx.moveTo(offset, height - offset);
  ctx.lineTo(width - offset, height - offset);
  ctx.stroke();
  
  // Left border
  ctx.beginPath();
  ctx.moveTo(offset, offset);
  ctx.lineTo(offset, height - offset);
  ctx.stroke();
  
  // Right border
  ctx.beginPath();
  ctx.moveTo(width - offset, offset);
  ctx.lineTo(width - offset, height - offset);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draw classic corner decorations
 */
function drawClassicCorners(ctx: CanvasRenderingContext2D, width: number, height: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#d4af37';
  
  // Corner positions
  const corners = [
    { x: 80, y: 80 }, // Top-left
    { x: width - 80, y: 80 }, // Top-right
    { x: 80, y: height - 80 }, // Bottom-left
    { x: width - 80, y: height - 80 } // Bottom-right
  ];
  
  corners.forEach(corner => {
    ctx.save();
    ctx.translate(corner.x, corner.y);
    
    // Adjust rotation for each corner
    let rotation = 0;
    if (corner.x > width/2 && corner.y < height/2) rotation = Math.PI/2; // Top-right
    if (corner.x > width/2 && corner.y > height/2) rotation = Math.PI; // Bottom-right
    if (corner.x < width/2 && corner.y > height/2) rotation = -Math.PI/2; // Bottom-left
    ctx.rotate(rotation);
    
    // Draw corner ornament
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size/3, -size/2);
    ctx.lineTo(size/1.5, 0);
    ctx.lineTo(size/3, size/2);
    ctx.closePath();
    ctx.fill();
    
    // Add decorative dot
    ctx.fillStyle = '#0a2342';
    ctx.beginPath();
    ctx.arc(size/3, 0, size/15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Draw elegant top banner
 */
function drawTopBanner(ctx: CanvasRenderingContext2D, width: number) {
  ctx.save();
  
  // Banner background with gradient
  const bannerGradient = ctx.createLinearGradient(0, 0, 0, 150);
  bannerGradient.addColorStop(0, 'rgba(10, 35, 66, 0.1)');
  bannerGradient.addColorStop(1, 'rgba(10, 35, 66, 0)');
  
  ctx.fillStyle = bannerGradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 150);
  ctx.quadraticCurveTo(width/2, 100, 0, 150);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw decorative medallion for logo
 */
function drawMedallion(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  
  // Outer gold ring
  const gradient = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
  gradient.addColorStop(0, '#f4e4a6');
  gradient.addColorStop(1, '#d4af37');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner white circle
  ctx.fillStyle = '#fefcf6';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  
  // Decorative outer rings
  ctx.strokeStyle = '#0a2342';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Add shine effect to medallion
 */
function addMedallionShine(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  
  // Shine gradient
  const shineGradient = ctx.createRadialGradient(
    x - radius/3, y - radius/3, 0,
    x - radius/3, y - radius/3, radius/2
  );
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = shineGradient;
  ctx.beginPath();
  ctx.arc(x - radius/3, y - radius/3, radius/2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw decorative divider
 */
function drawDecorativeDivider(ctx: CanvasRenderingContext2D, startX: number, y: number, endX: number) {
  ctx.save();
  
  // Main gold line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  
  // Decorative elements at ends
  ctx.fillStyle = '#d4af37';
  
  // Left ornament
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(startX - 20, y - 15);
  ctx.lineTo(startX - 20, y + 15);
  ctx.closePath();
  ctx.fill();
  
  // Right ornament
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX + 20, y - 15);
  ctx.lineTo(endX + 20, y + 15);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw prominent signature area with enhanced visibility
 */
function drawSignatureArea(ctx: CanvasRenderingContext2D, width: number, signatureSectionY: number, signatureImg: HTMLImageElement | null) {
  const signatureX = width / 2;
  const signatureY = signatureSectionY - 100;
  
  // === SIGNATURE IMAGE - EXTREMELY LARGE AND CLEAR ===
  if (signatureImg) {
    try {
      // White background for maximum contrast
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(signatureX - 240, signatureY - 100, 480, 220);
      
      // Gold border around signature area
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(signatureX - 240, signatureY - 100, 480, 220);
      
      // Signature shadow for depth
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.shadowBlur = 8;
      
      // Draw signature with very large dimensions
      const signatureWidth = 420; // Much larger for visibility
      const signatureHeight = 140;
      const signatureXPos = signatureX - signatureWidth/2;
      const signatureYPos = signatureY - signatureHeight/2;
      
      ctx.drawImage(signatureImg, signatureXPos, signatureYPos, signatureWidth, signatureHeight);
      ctx.restore();
      
    } catch (err) {
      console.warn('Failed to draw signature image, using text fallback', err);
      drawSignatureFallback(ctx, signatureX, signatureY);
    }
  } else {
    drawSignatureFallback(ctx, signatureX, signatureY);
  }
  
  // Signature line
  ctx.strokeStyle = '#0a2342';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(signatureX - 220, signatureY + 85);
  ctx.lineTo(signatureX + 220, signatureY + 85);
  ctx.stroke();
  
  // CEO Name - Bold and clear
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;
  
  ctx.font = 'bold 44px "Playfair Display", "Times New Roman", serif';
  ctx.fillStyle = '#0a2342';
  ctx.textAlign = 'center';
  ctx.fillText('Ndubuisi Osinachi Blessed', signatureX, signatureY + 140);
  
  ctx.font = 'bold 32px "Crimson Text", "Georgia", serif';
  ctx.fillStyle = '#d4af37';
  ctx.fillText('Chief Executive Officer', signatureX, signatureY + 185);
  
  ctx.font = 'italic 28px "Crimson Text", "Georgia", serif';
  ctx.fillStyle = '#4a4a4a';
  ctx.fillText('Lebanon Academy', signatureX, signatureY + 225);
  ctx.restore();
}

/**
 * Fallback signature (if image fails to load)
 */
function drawSignatureFallback(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Draw prominent signature line
  ctx.save();
  ctx.strokeStyle = '#0a2342';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  // Draw a decorative handwritten-style line
  ctx.beginPath();
  ctx.moveTo(x - 200, y - 30);
  ctx.bezierCurveTo(x - 150, y - 80, x + 150, y + 80, x + 200, y - 30);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x - 180, y);
  ctx.bezierCurveTo(x - 100, y - 40, x + 100, y + 40, x + 180, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Add final emboss effect to entire certificate
 */
function addEmbossEffect(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  
  // Create subtle emboss effect
  const embossGradient = ctx.createRadialGradient(
    width/2, height/2, 0,
    width/2, height/2, Math.sqrt(width*width + height*height)/2
  );
  embossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  embossGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  embossGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  
  ctx.fillStyle = embossGradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}

/**
 * Draw a star shape
 */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;

    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

/**
 * Helper function to wrap text for canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Load signature image from backend (WITH ENHANCED VISIBILITY)
 */
function loadSignatureImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Signature image load timeout'));
    }, 10000); // Increased timeout for better loading
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('Signature image loaded successfully');
      
      // Pre-process image for better visibility
      preprocessSignatureImage(img);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load signature image'));
    };
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    img.src = `${apiUrl}/api/signature/?timestamp=${Date.now()}`; // Cache busting
  });
}

/**
 * Preprocess signature image for maximum visibility
 */
function preprocessSignatureImage(img: HTMLImageElement) {
  // Create canvas to process the signature
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Enhance contrast and darkness
  for (let i = 0; i < data.length; i += 4) {
    // Darken the signature (make more visible)
    if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) {
      data[i] = Math.max(0, data[i] - 50);     // Red
      data[i + 1] = Math.max(0, data[i + 1] - 50); // Green
      data[i + 2] = Math.max(0, data[i + 2] - 50); // Blue
    }
    
    // Increase opacity
    if (data[i + 3] < 255) {
      data[i + 3] = Math.min(255, data[i + 3] * 1.5);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Update img src with processed image
  img.src = canvas.toDataURL();
}

/**
 * Load logo image from backend
 */
function loadLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Logo image load timeout'));
    }, 8000);
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('Logo image loaded successfully');
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load logo image'));
    };
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    img.src = `${apiUrl}/api/logo/?timestamp=${Date.now()}`; // Cache busting
  });
}

/**
 * Generate a unique certificate ID based on timestamp and random hash
 */
function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `LA-${timestamp}-${random}`;
}

/**
 * Download certificate as PNG file with premium naming
 */
export async function downloadCertificate(
  blob: Blob,
  courseName: string,
  username: string
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Create premium filename
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const filename = `Certificate_of_Excellence_${courseName.replace(/\s+/g, '_')}_${username}_${date}.png`;
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Share certificate to social media with premium messaging
 */
export function shareToSocialMedia(courseName: string, username: string): void {
  const text = `🎓 I'm proud to share my Certificate of Excellence in "${courseName}" from Lebanon Academy! 
    Honored to be recognized for academic achievement. #LebanonAcademy #Excellence #Certification`;
  
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  // Open in popup window
  const width = 550;
  const height = 420;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  window.open(
    shareUrl,
    'share-certificate',
    `width=${width},height=${height},top=${top},left=${left}`
  );
}

/**
 * Preview certificate in new window
 */
export function previewCertificate(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const width = 1024;
  const height = 768;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  const previewWindow = window.open(
    url,
    'certificate-preview',
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
  );
  
  if (previewWindow) {
    previewWindow.document.title = 'Certificate Preview - Lebanon Academy';
  }
}