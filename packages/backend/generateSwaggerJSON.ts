import swaggerAutogen from 'swagger-autogen'
import { environment } from './environment'

const config = {
  info: {
    version: '0.0.2',
    title: 'WAFRN Backend',
    description: 'API routes for wafrn social network'
  },
  host: `${environment.frontendUrl}`,
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
}

const files = [
  './index.ts',
  './routes/blocks.ts',
  './routes/follows.ts',
  './routes/media.ts',
  './routes/notifications.ts',
  './routes/posts.ts',
  './routes/search.ts',
  './routes/users.ts',
  './routes/admin.ts',
  './routes/blockUserServer.ts',
  './routes/blocks.ts',
  './routes/like.ts',
  './routes/mute.ts',
  './routes/deletepost.ts',
  './routes/lists.ts'
]

swaggerAutogen({ openapi: '3.0.0' })('./swagger.json', files, config)
