import { FirebaseStorageProvider } from './storage/FirebaseStorageProvider';
import { DocumentStorageService } from './storage/DocumentStorageService';
import { MigrationService } from './storage/MigrationService';
import { ViewerStrategyFactory } from './viewer/ViewerStrategyFactory';

export const storageProvider = new FirebaseStorageProvider();
export const documentStorageService = new DocumentStorageService(storageProvider);
export const migrationService = new MigrationService(documentStorageService);
export const viewerStrategyFactory = new ViewerStrategyFactory(documentStorageService, migrationService);
