import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) { }

  async proxyRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    pathPrefix: string,
  ) {
    try {
      // Remove the prefix from the path
      let path = req.url;

      // Handle /api prefix if present
      if (path.startsWith('/api')) {
        path = path.replace('/api', '');
      }

      // Remove the service prefix (e.g. /lottery)
      if (path.startsWith(pathPrefix)) {
        path = path.replace(pathPrefix, '');
      }

      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      const url = `${targetUrl}${path}`;

      console.log(`[Proxy] ${req.method} ${req.url} -> ${url}`);

      // Forward the request
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url,
          data: req.body,
          headers: {
            ...req.headers,
            host: new URL(targetUrl).host,
          },
          params: req.query,
        }),
      );

      // Forward the response
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error(`[Proxy Error] ${error.message}`);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          statusCode: 500,
          message: 'Internal server error',
          error: error.message,
        });
      }
    }
  }
}
