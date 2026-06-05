// src/firebase/firebase.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger('FirebaseService');
  private dbInstance!: admin.firestore.Firestore;
  private isFallbackMode = false;
  // Fallback in-memory database for users/workspaces/chats if key is not found
  private mockDb: any = {
    users: [],
    workspaces: [],
    chats: [],
    messages: {},
  };

  onModuleInit() {
    const keyPath = path.resolve(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.dbInstance = admin.firestore();
        this.logger.log('Firebase Admin SDK initialized successfully with service account.');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK. Falling back to in-memory mode.', error);
        this.isFallbackMode = true;
      }
    } else {
      this.logger.warn(`
=============================================================
[WARNING] Firebase service account key not found!
Path: ${keyPath}
Please place your 'firebase-service-account.json' key in the dyms-server folder.
Falling back to temporary in-memory database mode for now.
=============================================================
      `);
      this.isFallbackMode = true;
    }
  }

  get db() {
    if (this.isFallbackMode) {
      return null;
    }
    return this.dbInstance;
  }

  get fallbackDb() {
    return this.mockDb;
  }

  isFallback() {
    return this.isFallbackMode;
  }
}
