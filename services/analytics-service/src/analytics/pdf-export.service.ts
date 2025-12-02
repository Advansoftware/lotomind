import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) { }

  async generatePredictionReport(predictionId: number): Promise<string> {
    try {
      // Fetch prediction data
      const prediction = await this.dataSource.query(
        `SELECT 
          p.*,
          s.display_name as strategyName,
          lt.name as lotteryType
         FROM predictions p
         JOIN strategies s ON p.strategy_id = s.id
         JOIN lottery_types lt ON p.lottery_type_id = lt.id
         WHERE p.id = ?`,
        [predictionId]
      );

      if (!prediction || prediction.length === 0) {
        throw new Error('Prediction not found');
      }

      const data = prediction[0];
      const filename = `prediction-${predictionId}-${Date.now()}.pdf`;
      const filepath = join('/tmp', filename);

      // Create PDF
      const doc = new PDFDocument();
      doc.pipe(createWriteStream(filepath));

      // Header
      doc.fontSize(20).text('LotoMind Analytics', { align: 'center' });
      doc.fontSize(16).text('Relatório de Predição', { align: 'center' });
      doc.moveDown();

      // Prediction Details
      doc.fontSize(12).text(`Loteria: ${data.lotteryType.toUpperCase()}`);
      doc.text(`Concurso Alvo: ${data.target_concurso}`);
      doc.text(`Estratégia: ${data.strategyName}`);
      doc.text(`Confiança: ${(data.confidence_score * 100).toFixed(2)}%`);
      doc.text(`Data: ${new Date(data.created_at).toLocaleDateString('pt-BR')}`);
      doc.moveDown();

      // Predicted Numbers
      doc.fontSize(14).text('Números Previstos:', { underline: true });
      doc.fontSize(16).text(JSON.parse(data.predicted_numbers).join(' - '), {
        align: 'center',
      });
      doc.moveDown();

      // Results (if checked)
      if (data.status === 'checked' && data.actual_numbers) {
        doc.fontSize(14).text('Resultado:', { underline: true });
        doc.fontSize(12).text(`Números Sorteados: ${JSON.parse(data.actual_numbers).join(' - ')}`);
        doc.text(`Acertos: ${data.hits} de 6`);

        if (data.matched_numbers) {
          doc.text(`Números Acertados: ${JSON.parse(data.matched_numbers).join(' - ')}`);
        }

        if (data.prize_won > 0) {
          doc.text(`Prêmio: R$ ${parseFloat(data.prize_won).toFixed(2)}`);
        }
      }

      doc.end();

      this.logger.log(`PDF report generated: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Error generating PDF: ${error.message}`);
      throw error;
    }
  }

  async generateBacktestReport(lotteryType: string): Promise<string> {
    try {
      // Fetch backtest results
      const results = await this.dataSource.query(
        `SELECT 
          s.display_name as strategy,
          br.*
         FROM backtest_results br
         JOIN strategies s ON br.strategy_id = s.id
         JOIN lottery_types lt ON br.lottery_type_id = lt.id
         WHERE lt.name = ?
         ORDER BY br.avg_hits DESC`,
        [lotteryType]
      );

      const filename = `backtest-${lotteryType}-${Date.now()}.pdf`;
      const filepath = join('/tmp', filename);

      const doc = new PDFDocument();
      doc.pipe(createWriteStream(filepath));

      // Header
      doc.fontSize(20).text('LotoMind Analytics', { align: 'center' });
      doc.fontSize(16).text('Relatório de Backtesting', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Loteria: ${lotteryType.toUpperCase()}`);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
      doc.moveDown();

      // Results Table
      doc.fontSize(14).text('Resultados por Estratégia:', { underline: true });
      doc.moveDown();

      results.forEach((result, index) => {
        doc.fontSize(12).text(`${index + 1}. ${result.strategy}`);
        doc.fontSize(10).text(`   Média de Acertos: ${result.avg_hits.toFixed(2)}`);
        doc.text(`   Taxa de Sucesso: ${(result.hit_rate * 100).toFixed(2)}%`);
        doc.text(`   Acurácia: ${(result.accuracy * 100).toFixed(2)}%`);
        doc.text(`   Predições Testadas: ${result.total_predictions}`);
        doc.moveDown(0.5);
      });

      doc.end();

      this.logger.log(`Backtest PDF report generated: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Error generating backtest PDF: ${error.message}`);
      throw error;
    }
  }
}
