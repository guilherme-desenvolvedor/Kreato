import { jsPDF } from 'jspdf';
import { Script } from '../types';

export function exportScriptToPdf(script: Script) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Primary palette
  const orange = [242, 140, 69]; // #F28C45
  const dark = [35, 31, 27];     // #231F1B
  const gray = [114, 104, 92];   // #72685C
  const lightBg = [250, 247, 242]; // #FAF7F2

  let y = margin;

  // Header banner
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');
  doc.setDrawColor(229, 220, 203);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'S');

  // Brand title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text('KREATO STUDIO', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text('Roteiro Estruturado de Gravação & Produção', margin + 6, y + 17);

  // Date on the right
  const dateStr = new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dateStr}`, pageWidth - margin - 6, y + 10, { align: 'right' });
  doc.text(`Tempo est.: ${script.readingTimeMinutes} min (~${script.wordCount} palavras)`, pageWidth - margin - 6, y + 17, { align: 'right' });

  y += 32;

  // Script Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const splitTitle = doc.splitTextToSize(script.title, contentWidth);
  doc.text(splitTitle, margin, y);
  y += splitTitle.length * 8 + 4;

  // Metadata pills
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  const metaLine = `Plataforma: ${script.platform.toUpperCase()}   |   Formato: ${script.format}   |   Status: ${script.status.toUpperCase()}`;
  doc.text(metaLine, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(229, 220, 203);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Section 1: O Gancho (Hook)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text('1. O GANCHO (00:00 - 00:04)', margin, y);
  y += 6;

  doc.setFillColor(254, 246, 238); // light orange box
  const splitHook = doc.splitTextToSize(script.hook || '(Sem gancho informado)', contentWidth - 10);
  const hookBoxHeight = splitHook.length * 5.5 + 8;
  doc.roundedRect(margin, y, contentWidth, hookBoxHeight, 2, 2, 'F');
  doc.setDrawColor(242, 140, 69);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin, y + hookBoxHeight);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(splitHook, margin + 5, y + 6);
  y += hookBoxHeight + 10;

  // Section 2: Desenvolvimento (Body)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(82, 125, 187); // #527DBB (Blue)
  doc.text('2. DESENVOLVIMENTO & CONTEÚDO (00:04 - FIM)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const splitBody = doc.splitTextToSize(script.body || '(Sem desenvolvimento informado)', contentWidth);

  for (let i = 0; i < splitBody.length; i++) {
    if (y > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }
    doc.text(splitBody[i], margin, y);
    y += 5.5;
  }
  y += 8;

  // Section 3: Chamada para Ação (CTA)
  if (y > pageHeight - margin - 35) {
    doc.addPage();
    y = margin;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(146, 116, 200); // #9274C8 (Purple)
  doc.text('3. CHAMADA PARA AÇÃO (CTA)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const splitCta = doc.splitTextToSize(script.cta || '(Sem chamada para ação)', contentWidth);
  doc.text(splitCta, margin, y);
  y += splitCta.length * 5.5 + 8;

  // Section 4: Notas de Gravação
  if (script.notes) {
    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('OBSERVAÇÕES E NOTAS DE PRODUÇÃO:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(script.notes, contentWidth);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5 + 6;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(
      `Kreato Creator Studio • Página ${i} de ${totalPages} • Gerado em ${dateStr}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Sanitize filename
  const safeTitle = script.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);
  doc.save(`roteiro-${safeTitle || 'kreato'}.pdf`);
}
