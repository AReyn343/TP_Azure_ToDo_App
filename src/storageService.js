const fs = require('fs/promises');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

class StorageService {
  constructor(config) {
    this.config = config;
    this.localExportDir = path.join(__dirname, '..', 'data', 'exports');
  }

  async exportTasks(tasks) {
    const fileName = `tasks-export-${Date.now()}.json`;
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), count: tasks.length, tasks }, null, 2);

    if (this.config.connectionString) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(this.config.connectionString);
      const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.upload(payload, Buffer.byteLength(payload), {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });

      return {
        provider: 'azure-blob',
        fileName,
        url: blockBlobClient.url
      };
    }

    await fs.mkdir(this.localExportDir, { recursive: true });
    const fullPath = path.join(this.localExportDir, fileName);
    await fs.writeFile(fullPath, payload, 'utf8');

    return {
      provider: 'local-file',
      fileName,
      path: fullPath
    };
  }
}

module.exports = StorageService;
