import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as tf from '@tensorflow/tfjs';

interface LSTMConfig {
  sequenceLength: number;
  epochs: number;
  batchSize: number;
  units: number;
  learningRate: number;
}

interface ModelMetadata {
  inputShape: number[];
  outputSize: number;
  config: LSTMConfig;
  trainedAt: Date;
  loss: number;
  accuracy: number;
  epochsTrained: number;
}

@Injectable()
export class LSTMStrategy implements OnModuleInit {
  name = 'lstm_deep';
  displayName = 'LSTM Deep Learning';

  private readonly logger = new Logger(LSTMStrategy.name);
  private models: Map<string, tf.LayersModel> = new Map();
  private modelMetadata: Map<string, ModelMetadata> = new Map();
  private isReady = false;

  constructor(private dataSource: DataSource) { }

  async onModuleInit() {
    // Criar tabela de modelos se não existir
    await this.ensureModelTable();

    // Carregar modelos salvos do banco
    await this.loadAllModelsFromDB();

    this.isReady = true;
    this.logger.log('LSTM Strategy initialized - Models loaded from database');
  }

  /**
   * Garante que a tabela de modelos existe
   */
  private async ensureModelTable(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ml_models (
          id INT AUTO_INCREMENT PRIMARY KEY,
          model_key VARCHAR(100) UNIQUE NOT NULL,
          model_topology JSON NOT NULL,
          model_weights LONGBLOB NOT NULL,
          metadata JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_model_key (model_key)
        )
      `);
      this.logger.log('ML models table ready');
    } catch (error) {
      this.logger.error(`Failed to create ml_models table: ${error.message}`);
    }
  }

  /**
   * Carrega todos os modelos do banco de dados
   */
  private async loadAllModelsFromDB(): Promise<void> {
    try {
      const savedModels = await this.dataSource.query(`
        SELECT model_key, model_topology, model_weights, metadata
        FROM ml_models
        WHERE model_key LIKE 'lstm_%'
      `);

      for (const row of savedModels) {
        try {
          await this.loadModelFromRow(row);
        } catch (error) {
          this.logger.warn(`Failed to load model ${row.model_key}: ${error.message}`);
        }
      }

      this.logger.log(`Loaded ${this.models.size} LSTM models from database`);
    } catch (error) {
      this.logger.error(`Failed to load models from DB: ${error.message}`);
    }
  }

  /**
   * Carrega um modelo a partir de uma linha do banco
   */
  private async loadModelFromRow(row: any): Promise<void> {
    const { model_key, model_topology, model_weights, metadata } = row;

    // Parse da topologia
    const topology = typeof model_topology === 'string'
      ? JSON.parse(model_topology)
      : model_topology;

    // Parse dos pesos (Buffer para Float32Array)
    const weightsBuffer = Buffer.from(model_weights);

    // Reconstruir modelo
    const model = await this.reconstructModel(topology, weightsBuffer);

    if (model) {
      this.models.set(model_key, model);

      const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      this.modelMetadata.set(model_key, meta);

      this.logger.log(`Model ${model_key} loaded from database`);
    }
  }

  /**
   * Reconstrói modelo a partir da topologia e pesos
   */
  private async reconstructModel(
    topology: any,
    weightsBuffer: Buffer
  ): Promise<tf.LayersModel | null> {
    try {
      // Criar modelo vazio com a mesma arquitetura
      const model = await tf.models.modelFromJSON(topology);

      // Extrair informações de pesos
      const weightSpecs = topology.weightsManifest?.[0]?.weights || [];

      if (weightSpecs.length > 0 && weightsBuffer.length > 0) {
        // Converter buffer para tensores
        const weights = this.bufferToWeights(weightsBuffer, weightSpecs);
        model.setWeights(weights);

        // Limpar tensores temporários
        weights.forEach(w => w.dispose());
      }

      // Recompilar modelo
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      return model;
    } catch (error) {
      this.logger.error(`Failed to reconstruct model: ${error.message}`);
      return null;
    }
  }

  /**
   * Converte buffer para array de tensores de peso
   */
  private bufferToWeights(buffer: Buffer, weightSpecs: any[]): tf.Tensor[] {
    const weights: tf.Tensor[] = [];
    let offset = 0;

    for (const spec of weightSpecs) {
      const { shape, dtype } = spec;
      const size = shape.reduce((a: number, b: number) => a * b, 1);
      const byteSize = size * 4; // float32 = 4 bytes

      const slice = buffer.slice(offset, offset + byteSize);
      const floatArray = new Float32Array(slice.buffer, slice.byteOffset, size);

      weights.push(tf.tensor(Array.from(floatArray), shape, dtype || 'float32'));
      offset += byteSize;
    }

    return weights;
  }

  /**
   * Converte pesos do modelo para buffer
   */
  private weightsToBuffer(model: tf.LayersModel): Buffer {
    const weights = model.getWeights();
    const arrays: Float32Array[] = [];

    for (const weight of weights) {
      const data = weight.dataSync() as Float32Array;
      arrays.push(new Float32Array(data));
    }

    // Calcular tamanho total
    const totalSize = arrays.reduce((sum, arr) => sum + arr.byteLength, 0);
    const buffer = Buffer.alloc(totalSize);

    let offset = 0;
    for (const arr of arrays) {
      Buffer.from(arr.buffer).copy(buffer, offset);
      offset += arr.byteLength;
    }

    return buffer;
  }

  /**
   * Salva modelo no banco de dados
   */
  private async saveModelToDB(
    key: string,
    model: tf.LayersModel,
    metadata: ModelMetadata
  ): Promise<void> {
    try {
      // Obter topologia do modelo
      const topology = model.toJSON(null, false);

      // Obter pesos como buffer
      const weightsBuffer = this.weightsToBuffer(model);

      // Upsert no banco
      await this.dataSource.query(`
        INSERT INTO ml_models (model_key, model_topology, model_weights, metadata)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          model_topology = VALUES(model_topology),
          model_weights = VALUES(model_weights),
          metadata = VALUES(metadata),
          updated_at = CURRENT_TIMESTAMP
      `, [
        key,
        JSON.stringify(topology),
        weightsBuffer,
        JSON.stringify(metadata)
      ]);

      this.modelMetadata.set(key, metadata);
      this.logger.log(`Model ${key} saved to database`);
    } catch (error) {
      this.logger.error(`Failed to save model ${key}: ${error.message}`);
    }
  }

  /**
   * Carrega modelo específico do banco
   */
  private async loadModelFromDB(key: string): Promise<tf.LayersModel | null> {
    try {
      const [row] = await this.dataSource.query(`
        SELECT model_topology, model_weights, metadata
        FROM ml_models
        WHERE model_key = ?
      `, [key]);

      if (row) {
        await this.loadModelFromRow({ model_key: key, ...row });
        return this.models.get(key) || null;
      }
    } catch (error) {
      this.logger.error(`Failed to load model ${key} from DB: ${error.message}`);
    }

    return null;
  }

  /**
   * Cria modelo LSTM
   */
  private createModel(inputShape: number[], outputSize: number, config: LSTMConfig): tf.LayersModel {
    const model = tf.sequential();

    // Camada LSTM 1
    model.add(tf.layers.lstm({
      units: config.units,
      returnSequences: true,
      inputShape: inputShape,
      dropout: 0.2,
      recurrentDropout: 0.2
    }));

    // Camada LSTM 2
    model.add(tf.layers.lstm({
      units: Math.floor(config.units / 2),
      returnSequences: false,
      dropout: 0.2
    }));

    // Camada densa
    model.add(tf.layers.dense({
      units: config.units,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Camada de saída
    model.add(tf.layers.dense({
      units: outputSize,
      activation: 'sigmoid'
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Prepara dados para LSTM
   */
  private prepareData(
    draws: any[],
    sequenceLength: number,
    maxNumber: number,
    minNumber: number
  ): { X: tf.Tensor3D; y: tf.Tensor2D } {
    const sequences: number[][][] = [];
    const labels: number[][] = [];
    const outputSize = maxNumber - minNumber + 1;

    for (let i = 0; i < draws.length - sequenceLength; i++) {
      const sequence: number[][] = [];

      for (let j = 0; j < sequenceLength; j++) {
        const draw = draws[i + j];
        const numbers = Array.isArray(draw.numbers) ? draw.numbers : JSON.parse(draw.numbers);
        const features = this.extractFeatures(numbers, maxNumber, minNumber);
        sequence.push(features);
      }

      sequences.push(sequence);

      const nextDraw = draws[i + sequenceLength];
      const nextNumbers = Array.isArray(nextDraw.numbers)
        ? nextDraw.numbers
        : JSON.parse(nextDraw.numbers);

      const label = new Array(outputSize).fill(0);
      nextNumbers.forEach((num: number) => {
        if (num >= minNumber && num <= maxNumber) {
          label[num - minNumber] = 1;
        }
      });
      labels.push(label);
    }

    return {
      X: tf.tensor3d(sequences),
      y: tf.tensor2d(labels)
    };
  }

  /**
   * Extrai features de um sorteio
   */
  private extractFeatures(numbers: number[], maxNumber: number, minNumber: number): number[] {
    const outputSize = maxNumber - minNumber + 1;
    const features = new Array(outputSize).fill(0);

    numbers.forEach((num: number) => {
      if (num >= minNumber && num <= maxNumber) {
        features[num - minNumber] = 1;
      }
    });

    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const oddCount = numbers.filter(n => n % 2 !== 0).length;
    const highCount = numbers.filter(n => n > (maxNumber / 2)).length;

    features.push(sum / (maxNumber * numbers.length));
    features.push(avg / maxNumber);
    features.push(oddCount / numbers.length);
    features.push(highCount / numbers.length);

    return features;
  }

  /**
   * Treina o modelo LSTM
   */
  async train(
    lotteryKey: string,
    draws: any[],
    config: Partial<LSTMConfig> = {}
  ): Promise<{ loss: number; accuracy: number }> {
    const fullConfig: LSTMConfig = {
      sequenceLength: config.sequenceLength || 10,
      epochs: config.epochs || 50,
      batchSize: config.batchSize || 32,
      units: config.units || 64,
      learningRate: config.learningRate || 0.001
    };

    this.logger.log(`Training LSTM for ${lotteryKey} with ${draws.length} draws`);

    const allNumbers = draws.flatMap(d =>
      Array.isArray(d.numbers) ? d.numbers : JSON.parse(d.numbers)
    );
    const minNumber = Math.min(...allNumbers);
    const maxNumber = Math.max(...allNumbers);
    const outputSize = maxNumber - minNumber + 1 + 4;

    const { X, y } = this.prepareData(draws, fullConfig.sequenceLength, maxNumber, minNumber);

    const model = this.createModel(
      [fullConfig.sequenceLength, outputSize],
      maxNumber - minNumber + 1,
      fullConfig
    );

    const history = await model.fit(X, y, {
      epochs: fullConfig.epochs,
      batchSize: fullConfig.batchSize,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            this.logger.debug(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
          }
        }
      }
    });

    const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
    const finalAcc = history.history.acc?.[history.history.acc.length - 1] as number || 0;

    // Salvar em memória
    this.models.set(`lstm_${lotteryKey}`, model);

    // Salvar no banco de dados para persistência
    const metadata: ModelMetadata = {
      inputShape: [fullConfig.sequenceLength, outputSize],
      outputSize: maxNumber - minNumber + 1,
      config: fullConfig,
      trainedAt: new Date(),
      loss: finalLoss,
      accuracy: finalAcc,
      epochsTrained: fullConfig.epochs
    };

    await this.saveModelToDB(`lstm_${lotteryKey}`, model, metadata);

    X.dispose();
    y.dispose();

    this.logger.log(`Training complete for ${lotteryKey}: loss=${finalLoss.toFixed(4)}, saved to database`);

    return { loss: finalLoss, accuracy: finalAcc };
  }

  /**
   * Faz previsão com o modelo LSTM
   */
  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const lotteryKey = config.lotteryKey || 'default';
    const sequenceLength = 10;
    const modelKey = `lstm_${lotteryKey}`;

    // Tentar carregar modelo da memória
    let model = this.models.get(modelKey);

    // Se não estiver em memória, carregar do banco
    if (!model) {
      model = await this.loadModelFromDB(modelKey);
    }

    // Se ainda não existir e tiver dados suficientes, treinar
    if (!model && historicalDraws.length > 100) {
      this.logger.log(`No model found for ${lotteryKey}, training new model...`);
      await this.train(lotteryKey, historicalDraws.slice(0, 500));
      model = this.models.get(modelKey);
    }

    if (!model) {
      return this.fallbackPredict(historicalDraws, numbersToDraw, maxNumber, minNumber);
    }

    // Preparar sequência de entrada
    const recentDraws = historicalDraws.slice(0, sequenceLength);
    const outputSize = maxNumber - minNumber + 1 + 4;

    const sequence: number[][] = [];
    for (const draw of recentDraws) {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : JSON.parse(draw.numbers);
      const features = this.extractFeatures(numbers, maxNumber, minNumber);
      sequence.push(features);
    }

    const input = tf.tensor3d([sequence]);
    const prediction = model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();

    const numberProbs = Array.from(probabilities)
      .map((prob, idx) => ({ number: idx + minNumber, probability: prob as number }))
      .filter(np => np.number <= maxNumber)
      .sort((a, b) => b.probability - a.probability);

    const selected = numberProbs
      .slice(0, numbersToDraw)
      .map(np => np.number)
      .sort((a, b) => a - b);

    input.dispose();
    prediction.dispose();

    return selected;
  }

  /**
   * Fallback quando não há modelo treinado
   */
  private fallbackPredict(
    draws: any[],
    count: number,
    maxNumber: number,
    minNumber: number
  ): number[] {
    const frequency = new Map<number, number>();
    const recent = draws.slice(0, 50);

    recent.forEach((draw, index) => {
      const weight = 1 - (index / 50);
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : JSON.parse(draw.numbers);
      numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + weight);
      });
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([num]) => num)
      .sort((a, b) => a - b);
  }

  /**
   * Retreina modelo com novos dados (fine-tuning)
   */
  async retrain(lotteryKey: string, draws: any[]): Promise<void> {
    const modelKey = `lstm_${lotteryKey}`;
    let model = this.models.get(modelKey);

    if (!model) {
      model = await this.loadModelFromDB(modelKey);
    }

    if (model) {
      const metadata = this.modelMetadata.get(modelKey);
      const { X, y } = this.prepareData(draws.slice(0, 100), 10, 60, 1);

      await model.fit(X, y, {
        epochs: 10,
        batchSize: 16
      });

      // Atualizar metadados
      const newMetadata: ModelMetadata = {
        ...metadata!,
        trainedAt: new Date(),
        epochsTrained: (metadata?.epochsTrained || 0) + 10
      };

      await this.saveModelToDB(modelKey, model, newMetadata);

      X.dispose();
      y.dispose();

      this.logger.log(`Model ${lotteryKey} retrained and saved`);
    } else {
      await this.train(lotteryKey, draws);
    }
  }

  /**
   * Obtém informações sobre modelos salvos
   */
  async getModelInfo(lotteryKey?: string): Promise<any> {
    if (lotteryKey) {
      const metadata = this.modelMetadata.get(`lstm_${lotteryKey}`);
      return metadata || null;
    }

    // Retornar todos os modelos
    const allModels: any[] = [];
    for (const [key, meta] of this.modelMetadata.entries()) {
      allModels.push({
        key,
        ...meta,
        inMemory: this.models.has(key)
      });
    }

    return allModels;
  }

  /**
   * Remove modelo
   */
  async deleteModel(lotteryKey: string): Promise<boolean> {
    const modelKey = `lstm_${lotteryKey}`;

    try {
      // Remover da memória
      const model = this.models.get(modelKey);
      if (model) {
        model.dispose();
        this.models.delete(modelKey);
      }
      this.modelMetadata.delete(modelKey);

      // Remover do banco
      await this.dataSource.query(`
        DELETE FROM ml_models WHERE model_key = ?
      `, [modelKey]);

      this.logger.log(`Model ${modelKey} deleted`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelKey}: ${error.message}`);
      return false;
    }
  }
}
