const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');

class CosmosTaskRepository {
  constructor({ endpoint, key, databaseId, containerId }) {
    this.client = new CosmosClient({ endpoint, key });
    this.databaseId = databaseId;
    this.containerId = containerId;
    this.container = null;
  }

  async init() {
    const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
    const { container } = await database.containers.createIfNotExists({
      id: this.containerId,
      partitionKey: { paths: ['/id'] }
    });
    this.container = container;
  }

  async getAll() {
    const querySpec = {
      query: 'SELECT * FROM c ORDER BY c.createdAt DESC'
    };
    const { resources } = await this.container.items.query(querySpec).fetchAll();
    return resources;
  }

  async create({ title }) {
    const item = {
      id: uuidv4(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'cosmos'
    };
    const { resource } = await this.container.items.create(item);
    return resource;
  }

  async toggle(id) {
    const { resource } = await this.container.item(id, id).read();
    if (!resource) return null;

    resource.completed = !resource.completed;
    resource.updatedAt = new Date().toISOString();
    const { resource: updated } = await this.container.items.upsert(resource);
    return updated;
  }

  async delete(id) {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error) {
      if (error.code === 404) return false;
      throw error;
    }
  }
}

module.exports = CosmosTaskRepository;
