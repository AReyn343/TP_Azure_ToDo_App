const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileTaskRepository {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensureFile() {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]', 'utf8');
    }
  }

  async readTasks() {
    await this.ensureFile();
    const content = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(content || '[]');
  }

  async writeTasks(tasks) {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(tasks, null, 2), 'utf8');
  }

  async getAll() {
    const tasks = await this.readTasks();
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async create({ title }) {
    const tasks = await this.readTasks();
    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'file'
    };
    tasks.push(newTask);
    await this.writeTasks(tasks);
    return newTask;
  }

  async toggle(id) {
    const tasks = await this.readTasks();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;

    tasks[index].completed = !tasks[index].completed;
    tasks[index].updatedAt = new Date().toISOString();
    await this.writeTasks(tasks);
    return tasks[index];
  }

  async delete(id) {
    const tasks = await this.readTasks();
    const nextTasks = tasks.filter((task) => task.id !== id);
    const deleted = nextTasks.length !== tasks.length;
    if (!deleted) return false;
    await this.writeTasks(nextTasks);
    return true;
  }
}

module.exports = FileTaskRepository;
