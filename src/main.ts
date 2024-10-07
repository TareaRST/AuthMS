import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';

async function bootstrap() {

  const logger = new Logger('Auth Main');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
  {
    transport: Transport.TCP,
    options: {
      port: envs.port
    }
  }
);

  app.useGlobalPipes(
    new ValidationPipe({
     transform: true,
     whitelist: true,
     forbidNonWhitelisted: true,
    })
  )

  await app.listen();
  logger.log(`Auth Microservice is running on port ${envs.port}`);


}
bootstrap();
