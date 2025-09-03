import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, SwaggerCustomOptions } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Weather API Documentation')
    .setDescription('API description')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 1,
    },
  };

  SwaggerModule.setup('api/swagger', app, document, swaggerOptions);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
