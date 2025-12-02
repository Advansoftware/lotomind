import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebsocketGateway');
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to LotoMind Analytics',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} subscribed to ${data.channel}`);
    client.join(data.channel);
    return { event: 'subscribed', data: { channel: data.channel } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} unsubscribed from ${data.channel}`);
    client.leave(data.channel);
    return { event: 'unsubscribed', data: { channel: data.channel } };
  }

  // Broadcast new draw to all clients
  broadcastNewDraw(lotteryType: string, draw: any) {
    this.logger.log(`Broadcasting new draw: ${lotteryType} #${draw.concurso}`);
    this.server.to(`lottery:${lotteryType}`).emit('newDraw', {
      lotteryType,
      draw,
    });
  }

  // Broadcast new prediction to all clients
  broadcastNewPrediction(lotteryType: string, prediction: any) {
    this.logger.log(`Broadcasting new prediction: ${lotteryType}`);
    this.server.to(`predictions:${lotteryType}`).emit('newPrediction', {
      lotteryType,
      prediction,
    });
  }

  // Broadcast prediction result to all clients
  broadcastPredictionResult(predictionId: number, result: any) {
    this.logger.log(`Broadcasting prediction result: ${predictionId}`);
    this.server.emit('predictionResult', {
      predictionId,
      result,
    });
  }

  // Broadcast backtest results
  broadcastBacktestResults(lotteryType: string, results: any[]) {
    this.logger.log(`Broadcasting backtest results: ${lotteryType}`);
    this.server.to(`backtest:${lotteryType}`).emit('backtestResults', {
      lotteryType,
      results,
    });
  }

  // Send message to specific client
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
