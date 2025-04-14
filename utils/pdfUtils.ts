import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from an HTML element
 * @param element The HTML element to convert to PDF
 * @param filename The name of the PDF file to download
 */
export const generatePDF = async (element: HTMLElement, filename: string = 'download.pdf') => {
  if (!element) {
    console.error('No element provided for PDF generation');
    return;
  }

  try {
    console.log('Starting PDF generation process...');
    
    // Set a fixed background color for the PDF
    const originalBackground = element.style.background;
    element.style.background = '#ffffff';
    
    // Create a canvas from the HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true, // Enable CORS for images
      allowTaint: true,
      backgroundColor: '#ffffff',
    });
    
    console.log('HTML converted to canvas successfully');
    
    // Calculate PDF dimensions based on canvas size
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF instance
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate the number of pages needed
    const pagesNeeded = Math.ceil(imgHeight / pageHeight);
    
    console.log(`PDF will have ${pagesNeeded} pages`);
    
    // Add image to PDF (divide into pages if needed)
    for (let i = 0; i < pagesNeeded; i++) {
      // For each page, calculate the slice of the canvas to use
      const srcY = i * pageHeight * canvas.width / imgWidth;
      const sliceHeight = Math.min(pageHeight, imgHeight - i * pageHeight);
      const destHeight = sliceHeight;
      
      // Add a new page if this isn't the first page
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add the image slice to the PDF
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.9), 
        'JPEG', 
        0, 
        0, 
        imgWidth, 
        destHeight, 
        undefined, 
        'FAST'
      );
      
      console.log(`Added page ${i+1} to PDF`);
    }
    
    // Restore original background
    element.style.background = originalBackground;
    
    // Save the PDF
    console.log('Saving PDF...');
    pdf.save(filename);
    
    console.log('PDF generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Generates a report PDF with a title and content
 * @param content HTML element containing the report content
 * @param title Title of the report
 * @param username User's name for the report
 */
export const generateReportPDF = async (
  content: HTMLElement,
  title: string = 'Thrive AI Report',
  username: string = 'User',
  date: string = new Date().toLocaleDateString()
) => {
  if (!content) {
    console.error('No content provided for report generation');
    return;
  }

  try {
    // Create a PDF document
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(title, 105, 20, { align: 'center' });
    
    // Add info
    pdf.setFontSize(12);
    pdf.text(`Generated for: ${username}`, 20, 30);
    pdf.text(`Date: ${date}`, 20, 37);
    
    // Add line separator
    pdf.line(20, 40, 190, 40);
    
    // Create a canvas from the content element
    const canvas = await html2canvas(content, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    // Calculate dimensions for the content
    const imgWidth = 170;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add content to PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 45, imgWidth, imgHeight);
    
    // Save the PDF
    const filename = `${title.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating report PDF:', error);
    return false;
  }
};

/**
 * Generates a PDF with chart data
 * @param chartElement The chart HTML element to include in the PDF
 * @param data Array of data objects to include as a table
 * @param title Title of the chart report
 * @param filename Name of the PDF file
 */
export const generateChartPDF = async (
  chartElement: HTMLElement,
  data: Array<any> = [],
  title: string = 'Chart Report',
  filename: string = 'chart-report.pdf'
) => {
  if (!chartElement) {
    console.error('No chart element provided for PDF generation');
    return;
  }

  try {
    // Create a PDF document
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(18);
    pdf.text(title, 105, 15, { align: 'center' });
    
    // Add date
    const currentDate = new Date().toLocaleDateString();
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' });
    
    // Create a canvas from the chart element
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    // Calculate dimensions for the chart
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add chart image to PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 30, imgWidth, imgHeight);
    
    // Add data table if provided
    if (data && data.length > 0) {
      // Calculate starting Y position after the chart
      const tableStartY = 40 + imgHeight;
      
      // Add table title
      pdf.setFontSize(14);
      pdf.text('Data Table', 105, tableStartY, { align: 'center' });
      
      // Get table headers (keys of the first object)
      const headers = Object.keys(data[0]);
      
      // Set up for simple table
      let yPosition = tableStartY + 10;
      const xStart = 15;
      const colWidth = 180 / headers.length;
      
      // Draw table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        pdf.text(header, xStart + (i * colWidth), yPosition);
      });
      
      // Move to next row and draw a line
      yPosition += 5;
      pdf.line(xStart, yPosition, xStart + 180, yPosition);
      yPosition += 5;
      
      // Draw table rows
      pdf.setFont('helvetica', 'normal');
      
      data.forEach((item, rowIndex) => {
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        headers.forEach((header, colIndex) => {
          const value = item[header] ? String(item[header]) : '';
          pdf.text(value, xStart + (colIndex * colWidth), yPosition);
        });
        
        // Move to next row
        yPosition += 7;
        
        // Add a light line between rows (except after the last row)
        if (rowIndex < data.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(xStart, yPosition - 3, xStart + 180, yPosition - 3);
          pdf.setDrawColor(0, 0, 0);
        }
      });
    }
    
    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating chart PDF:', error);
    return false;
  }
}; 
 