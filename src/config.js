const path = require('path');
require('dotenv').config();

const toBool = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

module.exports = {
  port: Number(process.env.PORT || 3000),
  dataMode: process.env.DATA_MODE || 'file',
  dataFilePath: process.env.DATA_FILE_PATH || path.join(__dirname, '..', 'data', 'tasks.json'),

  cosmos: {
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
    databaseId: process.env.COSMOS_DATABASE_ID || 'TodoAppDb',
    containerId: process.env.COSMOS_CONTAINER_ID || 'Tasks'
  },

  blob: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    containerName: process.env.BLOB_CONTAINER_NAME || 'exports'
  },

  keyVault: {
    vaultUrl: process.env.KEY_VAULT_URL,
    secretName: process.env.KEY_VAULT_SECRET_NAME || 'app-message'
  },

  app: {
    title: process.env.APP_TITLE || 'Azure TODO App',
    demoSecretFallback: process.env.DEMO_SECRET_FALLBACK || 'Secret local de démonstration',
    useManagedIdentity: toBool(process.env.USE_MANAGED_IDENTITY, false)
  }
};
