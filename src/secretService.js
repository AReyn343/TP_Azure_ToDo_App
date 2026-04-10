const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

class SecretService {
  constructor(config) {
    this.config = config;
  }

  async getDemoMessage() {
    const { vaultUrl, secretName } = this.config.keyVault;
    if (!vaultUrl) {
      return this.config.app.demoSecretFallback;
    }

    const credential = new DefaultAzureCredential();
    const client = new SecretClient(vaultUrl, credential);
    const secret = await client.getSecret(secretName);
    return secret.value;
  }
}

module.exports = SecretService;
