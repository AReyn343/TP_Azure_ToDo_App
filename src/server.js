const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const FileTaskRepository = require('./fileTaskRepository');
const CosmosTaskRepository = require('./cosmosTaskRepository');
const StorageService = require('./storageService');
const SecretService = require('./secretService');

async function createRepository() {
  if (config.dataMode === 'cosmos') {
    const repo = new CosmosTaskRepository(config.cosmos);
    await repo.init();
    return repo;
  }

  return new FileTaskRepository(config.dataFilePath);
}

async function start() {
  const app = express();
  const repository = await createRepository();
  const storageService = new StorageService(config.blob);
  const secretService = new SecretService(config);

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', async (req, res) => {
    let secretStatus = 'fallback';
    try {
      if (config.keyVault.vaultUrl) {
        await secretService.getDemoMessage();
        secretStatus = 'key-vault';
      }
    } catch (error) {
      secretStatus = 'error';
    }

    res.json({
      status: 'ok',
      appTitle: config.app.title,
      dataMode: config.dataMode,
      secretStatus
    });
  });

  app.get('/api/config', async (req, res) => {
    try {
      const message = await secretService.getDemoMessage();
      res.json({
        appTitle: config.app.title,
        message,
        dataMode: config.dataMode,
        blobContainer: config.blob.containerName
      });
    } catch (error) {
      res.status(500).json({ error: 'Impossible de lire le secret', details: error.message });
    }
  });

  app.get('/api/tasks', async (req, res) => {
    try {
      const tasks = await repository.getAll();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Impossible de récupérer les tâches', details: error.message });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Le titre est obligatoire' });
    }

    try {
      const task = await repository.create({ title });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Impossible de créer la tâche', details: error.message });
    }
  });

  app.patch('/api/tasks/:id/toggle', async (req, res) => {
    try {
      const task = await repository.toggle(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Tâche introuvable' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Impossible de modifier la tâche', details: error.message });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const deleted = await repository.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Tâche introuvable' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Impossible de supprimer la tâche', details: error.message });
    }
  });

  app.post('/api/tasks/export', async (req, res) => {
    try {
      const tasks = await repository.getAll();
      const result = await storageService.exportTasks(tasks);
      res.json({ message: 'Export réalisé avec succès', result });
    } catch (error) {
      res.status(500).json({ error: 'Impossible d’exporter les tâches', details: error.message });
    }
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  app.listen(config.port, () => {
    console.log(`TODO app démarrée sur le port ${config.port}`);
    console.log(`Mode de données: ${config.dataMode}`);
  });
}

start().catch((error) => {
  console.error('Erreur au démarrage de l’application:', error);
  process.exit(1);
});
