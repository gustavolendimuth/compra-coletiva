import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
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
  campaignName: string;
  campaignDeadline: Date | null;
  products: ProductTotal[];
  grandTotal: number;
  totalWeight: number;
  shippingCost: number;
  finalTotal: number;
}

export class InvoiceGenerator {
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
        doc.fontSize(12).font('Helvetica-Bold').text(`Campanha: ${data.campaignName}`);
        doc.fontSize(10).font('Helvetica').text(`ID: ${data.campaignId}`);
        if (data.campaignDeadline) {
          doc.text(`Prazo: ${new Date(data.campaignDeadline).toLocaleDateString('pt-BR')}`);
        }
        doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`);
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
          doc.text(`R$ ${product.unitPrice.toFixed(2)}`, colUnitPrice, yPosition);
          doc.text(`${product.totalWeight.toFixed(2)}`, colWeight, yPosition);
          doc.text(`R$ ${product.totalValue.toFixed(2)}`, colTotal, yPosition);

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
        doc.text(`${data.totalWeight.toFixed(2)} kg`, colTotal, yPosition);
        yPosition += 20;

        doc.font('Helvetica-Bold');
        doc.text('Subtotal Produtos:', 350, yPosition);
        doc.font('Helvetica');
        doc.text(`R$ ${data.grandTotal.toFixed(2)}`, colTotal, yPosition);
        yPosition += 20;

        doc.font('Helvetica-Bold');
        doc.text('Custo de Envio:', 350, yPosition);
        doc.font('Helvetica');
        doc.text(`R$ ${data.shippingCost.toFixed(2)}`, colTotal, yPosition);
        yPosition += 20;

        doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL:', 350, yPosition);
        doc.text(`R$ ${data.finalTotal.toFixed(2)}`, colTotal, yPosition);

        // Footer
        doc.fontSize(8).font('Helvetica').text(
          'Documento gerado automaticamente pelo sistema de Compra Coletiva',
          50,
          750,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
