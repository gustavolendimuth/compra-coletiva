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

  /**
   * Creates PDF document from invoice data
   */
  private static createPDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('FATURA PARA FORNECEDOR', { align: 'center' });
        doc.moveDown();

        // Campaign info
        const platformUrl = this.buildPlatformUrl();
        const campaignUrl = this.buildCampaignUrl(platformUrl, data.campaignSlug, data.campaignId);
        doc.fontSize(12).font('Helvetica-Bold').text('Campanha: ', { continued: true });
        doc.fillColor('blue').text(data.campaignName, { link: campaignUrl, underline: true });
        doc.fillColor('black');
        doc.fontSize(10).font('Helvetica');
        if (data.campaignDeadline) {
          doc.text(`Prazo: ${new Date(data.campaignDeadline).toLocaleDateString('pt-BR')}`);
        }
        doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`);
        doc.moveDown(0.4);
        doc.font('Helvetica-Bold').text('Link: ', { continued: true });
        doc.font('Helvetica');
        doc.fillColor('blue').text(campaignUrl, { link: campaignUrl, underline: true });
        doc.fillColor('black');
        doc.moveDown(2);

        // Table header
        const tableTop = doc.y;
        const colProduct = 50;
        const colQuantity = 280;
        const colUnitPrice = 350;
        const colWeight = 420;
        const colTotal = 480;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Produto', colProduct, tableTop);
        doc.text('Qtd', colQuantity, tableTop);
        doc.text('Preço Unit.', colUnitPrice, tableTop);
        doc.text('Peso (kg)', colWeight, tableTop);
        doc.text('Total', colTotal, tableTop);

        // Line under header
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        doc.font('Helvetica');
        let yPosition = tableTop + 25;

        data.products.forEach((product, index) => {
          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          const productName = product.productName.length > 30
            ? product.productName.substring(0, 27) + '...'
            : product.productName;

          doc.text(productName, colProduct, yPosition, { width: 220 });
          doc.text(product.totalQuantity.toString(), colQuantity, yPosition);
          doc.text(this.formatCurrency(product.unitPrice), colUnitPrice, yPosition);
          doc.text(this.formatWeightFromGrams(product.totalWeight), colWeight, yPosition);
          doc.text(this.formatCurrency(product.totalValue), colTotal, yPosition);

          yPosition += 20;

          // Add separator line every 5 items for readability
          if ((index + 1) % 5 === 0 && index !== data.products.length - 1) {
            doc.moveTo(50, yPosition - 5)
              .lineTo(550, yPosition - 5)
              .strokeOpacity(0.3)
              .stroke()
              .strokeOpacity(1);
          }
        });

        // Summary section
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        doc.font('Helvetica-Bold');
        doc.text('Peso Total:', 350, yPosition);
        doc.font('Helvetica');
        doc.text(this.formatWeightFromGrams(data.totalWeight), colTotal, yPosition);
        yPosition += 20;

        doc.font('Helvetica-Bold');
        doc.text('Subtotal Produtos:', 350, yPosition);
        doc.font('Helvetica');
        doc.text(this.formatCurrency(data.grandTotal), colTotal, yPosition);
        yPosition += 20;

        doc.font('Helvetica-Bold');
        doc.text('Custo de Envio:', 350, yPosition);
        doc.font('Helvetica');
        doc.text(this.formatCurrency(data.shippingCost), colTotal, yPosition);
        yPosition += 20;

        doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL:', 350, yPosition);
        doc.text(this.formatCurrency(data.finalTotal), colTotal, yPosition);

        // Footer
        doc.fontSize(8).font('Helvetica');
        const footerText = 'Documento gerado automaticamente pelo sistema de Compra Coletiva';
        const footerWidth = doc.widthOfString(footerText);
        const footerX = (doc.page.width - footerWidth) / 2;
        doc.text('Documento gerado automaticamente pelo sistema de ', footerX, 750, { continued: true });
        doc.fillColor('blue').text('Compra Coletiva', { link: platformUrl, underline: true });
        doc.fillColor('black');

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
