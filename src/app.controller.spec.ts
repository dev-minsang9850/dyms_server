import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return server status details', () => {
      const res = appController.getRoot();
      expect(res.service).toBe('DYMS Server');
      expect(res.status).toBe('ok');
      expect(res.timestamp).toBeDefined();
    });
  });
});
