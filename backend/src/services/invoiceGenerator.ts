import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductTotal {
  productId: string;
  productName: string;
  totalQuantity: number;
  unitPrice: number;
  totalValue: number;
  weight: number;
  totalWeight: number;
}

interface InvoiceData {
  campaignId: string;
  campaignSlug: string | null;
  campaignName: string;
  campaignDeadline: Date | null;
  products: ProductTotal[];
  grandTotal: number;
  totalWeight: number;
  shippingCost: number;
  finalTotal: number;
}

export class InvoiceGenerator {
  private static readonly gramsPerKilogram = 1000;
  private static readonly platformName = 'Compra Coletiva';
  private static readonly platformSlogan = 'Organize suas compras em grupo';

  private static readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  private static readonly numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private static formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private static formatWeightFromGrams(weightInGrams: number): string {
    const weightInKilograms = weightInGrams / this.gramsPerKilogram;
    return `${this.numberFormatter.format(weightInKilograms)} kg`;
  }

  private static buildPlatformUrl(): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return frontendUrl.replace(/\/$/, '');
  }

  private static buildCampaignUrl(platformUrl: string, campaignSlug: string | null, campaignId: string): string {
    const campaignIdentifier = campaignSlug || campaignId;
    return `${platformUrl}/campanhas/${campaignIdentifier}`;
  }

  /**
   * Generates a supplier invoice for a campaign
   * Aggregates all products sold with quantities and totals
   */
  static async generateSupplierInvoice(campaignId: string): Promise<Buffer> {
    // Fetch campaign with all orders and items
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        products: true,
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Aggregate product totals
    const productTotals = this.calculateProductTotals(campaign);

    const invoiceData: InvoiceData = {
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      campaignName: campaign.name,
      campaignDeadline: campaign.deadline,
      products: productTotals,
      grandTotal: productTotals.reduce((sum, p) => sum + p.totalValue, 0),
      totalWeight: productTotals.reduce((sum, p) => sum + p.totalWeight, 0),
      shippingCost: campaign.shippingCost,
      finalTotal: productTotals.reduce((sum, p) => sum + p.totalValue, 0) + campaign.shippingCost,
    };

    return this.createPDF(invoiceData);
  }

  /**
   * Calculates product totals from campaign orders
   */
  private static calculateProductTotals(campaign: any): ProductTotal[] {
    const productMap = new Map<string, ProductTotal>();

    // Initialize with all campaign products
    campaign.products.forEach((product: any) => {
      productMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        totalQuantity: 0,
        unitPrice: product.price,
        totalValue: 0,
        weight: product.weight,
        totalWeight: 0,
      });
    });

    // Aggregate quantities from all orders
    campaign.orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productTotal = productMap.get(item.productId);
        if (productTotal) {
          productTotal.totalQuantity += item.quantity;
          productTotal.totalValue += item.subtotal;
          productTotal.totalWeight += item.quantity * productTotal.weight;
        }
      });
    });

    // Filter out products with zero quantity and sort by name
    return Array.from(productMap.values())
      .filter((p) => p.totalQuantity > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }

  // ── Design tokens ──
  private static readonly colors = {
    primary50: '#f0f9ff',
    primary100: '#e0f2fe',
    primary200: '#bae6fd',
    primary500: '#0ea5e9',
    primary600: '#0284c7',
    primary700: '#0369a1',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray900: '#111827',
    white: '#ffffff',
  };

  private static readonly layout = {
    marginX: 48,
    pageWidth: 595.28, // A4
    get contentWidth() { return this.pageWidth - this.marginX * 2; },
    col: {
      product: 48,
      productW: 210,
      qty: 262,
      qtyW: 50,
      unitPrice: 318,
      unitPriceW: 78,
      weight: 402,
      weightW: 68,
      total: 476,
      totalW: 72,
    },
    rowHeight: 24,
    tableRight: 548,
  };

  /**
   * Draws the branded header bar with logo icon
   */
  private static drawHeader(doc: PDFKit.PDFDocument): number {
    const { marginX, contentWidth } = this.layout;
    const c = this.colors;
    const headerY = 32;
    const headerHeight = 56;

    // Solid blue header bar
    doc
      .roundedRect(marginX, headerY, contentWidth, headerHeight, 8)
      .fill(c.primary600);

    // Logo circle
    const circleX = marginX + 38;
    const circleY = headerY + headerHeight / 2;
    doc.circle(circleX, circleY, 16).fill(c.primary700);

    // Two-person icon inside circle
    doc.save();
    doc.translate(circleX - 10, circleY - 9);
    doc.strokeColor(c.white).lineWidth(1.6).fillColor(c.white);
    // Left person
    doc.circle(8, 5, 3).fill();
    doc.save().lineJoin('round');
    doc.path('M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6').stroke();
    doc.restore();
    // Right person
    doc.circle(18, 5, 3).fill();
    doc.save().lineJoin('round');
    doc.path('M12 18c0-3.3 2.7-6 6-6s6 2.7 6 6').stroke();
    doc.restore();
    doc.restore();

    // Brand name
    const textX = circleX + 28;
    doc
      .fillColor(c.white)
      .font('Helvetica-Bold')
      .fontSize(17)
      .text(this.platformName, textX, headerY + 12, { width: 300 });
    doc
      .fillColor(c.primary100)
      .font('Helvetica')
      .fontSize(9)
      .text(this.platformSlogan, textX, headerY + 31, { width: 300 });

    // Invoice label right-aligned
    doc
      .fillColor(c.primary200)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('FATURA', marginX, headerY + 14, {
        width: contentWidth - 16,
        align: 'right',
      });
    doc
      .fillColor(c.primary100)
      .font('Helvetica')
      .fontSize(8)
      .text('Para Fornecedor', marginX, headerY + 26, {
        width: contentWidth - 16,
        align: 'right',
      });

    return headerY + headerHeight;
  }

  /**
   * Draws the campaign information card
   */
  private static drawCampaignInfo(doc: PDFKit.PDFDocument, data: InvoiceData, startY: number): number {
    const { marginX, contentWidth } = this.layout;
    const c = this.colors;
    const platformUrl = this.buildPlatformUrl();
    const campaignUrl = this.buildCampaignUrl(platformUrl, data.campaignSlug, data.campaignId);

    const cardY = startY + 18;
    const cardPadding = 16;
    const cardHeight = data.campaignDeadline ? 102 : 86;

    // Card background
    doc
      .roundedRect(marginX, cardY, contentWidth, cardHeight, 6)
      .fill(c.gray50);
    doc
      .roundedRect(marginX, cardY, contentWidth, cardHeight, 6)
      .strokeColor(c.gray200)
      .stroke();

    // Left accent bar
    doc
      .roundedRect(marginX, cardY, 4, cardHeight, 2)
      .fill(c.primary500);

    const innerX = marginX + cardPadding + 4;
    let infoY = cardY + cardPadding;

    // Campaign name
    doc
      .fillColor(c.gray500)
      .font('Helvetica')
      .fontSize(8)
      .text('CAMPANHA', innerX, infoY);
    infoY += 12;

    doc
      .fillColor(c.primary700)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(data.campaignName, innerX, infoY, { link: campaignUrl, width: contentWidth - 40 });
    infoY += 20;

    // Info row
    doc.font('Helvetica').fontSize(9).fillColor(c.gray600);

    const issueDate = `Emitido em ${new Date().toLocaleDateString('pt-BR')}`;
    doc.text(issueDate, innerX, infoY);

    if (data.campaignDeadline) {
      const deadline = `Prazo: ${new Date(data.campaignDeadline).toLocaleDateString('pt-BR')}`;
      doc.text(deadline, innerX + 160, infoY);
    }

    infoY += 16;
    doc
      .fillColor(c.primary600)
      .fontSize(8)
      .text(campaignUrl, innerX, infoY, { link: campaignUrl, underline: true });

    return cardY + cardHeight;
  }

  /**
   * Draws a single table header row
   */
  private static drawTableHeader(doc: PDFKit.PDFDocument, y: number): void {
    const { marginX, contentWidth, col } = this.layout;
    const c = this.colors;

    // Header background
    const headerH = 24;
    doc.roundedRect(marginX, y, contentWidth, headerH, 4).fill(c.primary600);

    doc.fillColor(c.white).font('Helvetica-Bold').fontSize(8.5);
    const textY = y + (headerH - 8.5) / 2;
    doc.text('Produto', col.product + 12, textY, { width: col.productW, align: 'left' });
    doc.text('Qtd', col.qty, textY, { width: col.qtyW, align: 'right' });
    doc.text('Preco Unit.', col.unitPrice, textY, { width: col.unitPriceW, align: 'right' });
    doc.text('Peso', col.weight, textY, { width: col.weightW, align: 'right' });
    doc.text('Total', col.total, textY, { width: col.totalW - 10, align: 'right' });
  }

  /**
   * Draws the products table with alternating rows
   */
  private static drawTable(doc: PDFKit.PDFDocument, data: InvoiceData, startY: number): number {
    const { marginX, contentWidth, col, rowHeight, tableRight } = this.layout;
    const c = this.colors;

    const tableTop = startY + 20;

    // Section title
    doc
      .fillColor(c.gray900)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Produtos', marginX, tableTop);

    const productCount = `${data.products.length} ${data.products.length === 1 ? 'item' : 'itens'}`;
    doc
      .fillColor(c.gray500)
      .font('Helvetica')
      .fontSize(9)
      .text(productCount, marginX, tableTop + 2, {
        width: contentWidth,
        align: 'right',
      });

    const headerY = tableTop + 20;
    this.drawTableHeader(doc, headerY);

    let y = headerY + 30;

    data.products.forEach((product, index) => {
      // Page break check — redraw header on new page
      if (y > 710) {
        doc.addPage();
        this.drawPageDecoration(doc);
        this.drawTableHeader(doc, 40);
        y = 74;
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc
          .rect(marginX, y - 4, contentWidth, rowHeight)
          .fill(c.gray50);
      }

      // Row separator
      doc
        .moveTo(marginX, y - 4)
        .lineTo(tableRight, y - 4)
        .strokeColor(c.gray200)
        .lineWidth(0.5)
        .stroke();

      const productName =
        product.productName.length > 34
          ? product.productName.substring(0, 31) + '...'
          : product.productName;

      const textY = y + 2;
      doc.fillColor(c.gray900).font('Helvetica').fontSize(9);
      doc.text(productName, col.product + 12, textY, { width: col.productW, align: 'left' });
      doc.fillColor(c.gray700);
      doc.text(product.totalQuantity.toString(), col.qty, textY, { width: col.qtyW, align: 'right' });
      doc.text(this.formatCurrency(product.unitPrice), col.unitPrice, textY, { width: col.unitPriceW, align: 'right' });
      doc.fillColor(c.gray500).fontSize(8.5);
      doc.text(this.formatWeightFromGrams(product.totalWeight), col.weight, textY, { width: col.weightW, align: 'right' });
      doc.fillColor(c.gray900).font('Helvetica-Bold').fontSize(9);
      doc.text(this.formatCurrency(product.totalValue), col.total, textY, { width: col.totalW, align: 'right' });

      y += rowHeight;
    });

    // Bottom border of table
    doc
      .moveTo(marginX, y - 4)
      .lineTo(tableRight, y - 4)
      .strokeColor(c.gray300)
      .lineWidth(0.5)
      .stroke();

    return y;
  }

  /**
   * Draws the totals summary card
   */
  private static drawSummary(doc: PDFKit.PDFDocument, data: InvoiceData, startY: number): number {
    const { marginX, contentWidth } = this.layout;
    const c = this.colors;

    // Check if we need a new page for the summary
    if (startY > 650) {
      doc.addPage();
      this.drawPageDecoration(doc);
      startY = 50;
    }

    const cardX = marginX + contentWidth - 240;
    const cardWidth = 240;
    const cardY = startY + 12;
    const cardPad = 12;
    const cardHeight = 110;

    // Card background
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6).fill(c.gray50);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6).strokeColor(c.gray200).stroke();

    const labelX = cardX + cardPad;
    const valueX = cardX + 110;
    const valueWidth = 116;
    let y = cardY + cardPad;

    // Weight row
    doc.fillColor(c.gray600).font('Helvetica').fontSize(9);
    doc.text('Peso Total', labelX, y);
    doc.fillColor(c.gray700);
    doc.text(this.formatWeightFromGrams(data.totalWeight), valueX, y, { width: valueWidth, align: 'right' });
    y += 20;

    // Subtotal row
    doc.fillColor(c.gray600);
    doc.text('Subtotal Produtos', labelX, y);
    doc.fillColor(c.gray900);
    doc.text(this.formatCurrency(data.grandTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 20;

    // Shipping row
    doc.fillColor(c.gray600);
    doc.text('Custo de Envio', labelX, y);
    doc.fillColor(c.gray900);
    doc.text(this.formatCurrency(data.shippingCost), valueX, y, { width: valueWidth, align: 'right' });
    y += 16;

    // Divider
    doc.moveTo(labelX, y).lineTo(cardX + cardWidth - 14, y).strokeColor(c.gray300).lineWidth(0.5).stroke();
    y += 10;

    // Grand total with blue highlight
    doc
      .roundedRect(cardX + 6, y - 4, cardWidth - 12, 26, 4)
      .fill(c.primary50);

    doc.fillColor(c.primary700).font('Helvetica-Bold').fontSize(10);
    doc.text('TOTAL', labelX, y + 2);
    doc.fillColor(c.primary600).fontSize(13);
    doc.text(this.formatCurrency(data.finalTotal), valueX, y, { width: valueWidth, align: 'right' });

    return cardY + cardHeight;
  }

  /**
   * Draws a subtle top-right decorative corner element on each page
   */
  private static drawPageDecoration(doc: PDFKit.PDFDocument): void {
    const c = this.colors;
    // Subtle corner accent circles
    doc.save();
    doc.circle(doc.page.width - 20, 20, 40).fill(c.primary50);
    doc.circle(doc.page.width - 10, 10, 18).fill(c.primary100);
    doc.restore();
  }

  /**
   * Draws the page footer
   */
  private static drawFooter(doc: PDFKit.PDFDocument): void {
    const { marginX, contentWidth } = this.layout;
    const c = this.colors;
    const platformUrl = this.buildPlatformUrl();
    const footerY = 776;

    // Thin line
    doc
      .moveTo(marginX, footerY)
      .lineTo(marginX + contentWidth, footerY)
      .strokeColor(c.gray200)
      .lineWidth(0.5)
      .stroke();

    // Footer text (centered manually)
    const prefix = 'Documento gerado automaticamente por ';
    const brand = 'Compra Coletiva';
    doc.font('Helvetica').fontSize(7.5);
    const prefixWidth = doc.widthOfString(prefix);
    doc.font('Helvetica-Bold');
    const brandWidth = doc.widthOfString(brand);
    const totalTextWidth = prefixWidth + brandWidth;
    const startX = marginX + (contentWidth - totalTextWidth) / 2;

    const footerTextY = footerY + 8;

    doc
      .fillColor(c.gray500)
      .font('Helvetica')
      .fontSize(7.5)
      .text(prefix, startX, footerTextY, { lineBreak: false });
    doc
      .fillColor(c.primary600)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(brand, startX + prefixWidth, footerTextY, {
        link: platformUrl,
        width: brandWidth,
      });
  }

  /**
   * Creates PDF document from invoice data
   */
  private static createPDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 48, size: 'A4', bufferPages: true });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Page 1 decoration
        this.drawPageDecoration(doc);

        // Header
        const headerBottom = this.drawHeader(doc);

        // Campaign info card
        const infoBottom = this.drawCampaignInfo(doc, data, headerBottom);

        // Products table
        const tableBottom = this.drawTable(doc, data, infoBottom);

        // Summary totals card
        this.drawSummary(doc, data, tableBottom);

        // Footer on every page
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          this.drawFooter(doc);
        }

        doc.flushPages();
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
