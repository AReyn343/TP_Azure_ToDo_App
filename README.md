# Projet d'évaluation pratique Cloud Azure -- Application TODO

## URL de l'application

-   **Production** : https://todo-app-17443.azurewebsites.net/
-   **Staging** : https://todo-app-17443-staging.azurewebsites.net/

------------------------------------------------------------------------

## Choix technologique

### Backend / Frontend

-   **Node.js + Express**
-   Interface web simple en **HTML / CSS / JavaScript**

### Conteneurisation

-   **Docker**

### Hébergement Cloud

-   **Azure App Service for Containers**

### Stockage / Sécurité

-   **Azure Cosmos DB**
-   **Azure Key Vault**
-   **Azure Blob Storage**

------------------------------------------------------------------------

## Schéma d'architecture simple

``` text
Utilisateur
   |
   v
Azure App Service (Container Docker)
   |
   +--> Azure Cosmos DB (persistance des tâches)
   |
   +--> Azure Key Vault (lecture des secrets via Managed Identity)
   |
   +--> Azure Blob Storage (export JSON des tâches)
   |
   +--> Azure Container Registry (stockage de l’image Docker)
```

------------------------------------------------------------------------

## Ressources Azure utilisées

-   Resource Group : rg-todo-azure
-   Azure Container Registry
-   App Service Plan Standard S1
-   Azure Web App for Containers
-   Deployment Slot : staging
-   Azure Cosmos DB (SQL API)
-   Azure Key Vault
-   Azure Storage Account / Blob Container

------------------------------------------------------------------------

## Principales commandes Azure CLI utilisées

### Authentification / Subscription

``` bash
az login
az account show --output table
```

### Resource Group

``` bash
az group create   --name rg-todo-azure   --location switzerlandnorth
```

### Azure Container Registry

``` bash
az acr create   --resource-group rg-todo-azure   --name todoregistry3189   --sku Basic

az acr login --name todoregistry3189

docker tag todo-azure-app:v2 todoregistry3189.azurecr.io/todo-azure-app:v2
docker push todoregistry3189.azurecr.io/todo-azure-app:v2
```

### App Service

``` bash
az appservice plan create   --name plan-todo-azure   --resource-group rg-todo-azure   --location switzerlandnorth   --is-linux   --sku B1

az webapp create   --resource-group rg-todo-azure   --plan plan-todo-azure   --name todo-app-17443   --container-image-name todoregistry3189.azurecr.io/todo-azure-app:v2
```

### Cosmos DB

``` bash
az cosmosdb create   --name cosmos-todo-1234   --resource-group rg-todo-azure   --locations regionName=switzerlandnorth

az cosmosdb sql database create   --account-name cosmos-todo-1234   --resource-group rg-todo-azure   --name TodoApp

MSYS_NO_PATHCONV=1 az cosmosdb sql container create   --account-name cosmos-todo-1234   --resource-group rg-todo-azure   --database-name TodoApp   --name Tasks   --partition-key-path "/id"
```

### Key Vault

``` bash
az keyvault create   --name kv-todo-7920   --resource-group rg-todo-azure   --location switzerlandnorth   --enable-rbac-authorization true

az keyvault secret set   --vault-name kv-todo-7920   --name app-secret-message   --value "Bonjour depuis Azure Key Vault"
```

### Blob Storage

``` bash
az storage account create   --name sttodo12345   --resource-group rg-todo-azure   --location switzerlandnorth   --sku Standard_LRS   --kind StorageV2   --min-tls-version TLS1_2

az storage container create   --name exports   --connection-string "<storage-connection-string>"
```

### Deployment Slots

``` bash
az webapp deployment slot create   --resource-group rg-todo-azure   --name todo-app-17443   --slot staging
```

### Scaling

``` bash
az appservice plan update   --resource-group rg-todo-azure   --name plan-todo-azure   --number-of-workers 2
```

------------------------------------------------------------------------

## Utilisation des services Azure

### Azure Cosmos DB

Utilisé pour stocker les tâches de l'application TODO de manière
persistante dans une base NoSQL cloud.

### Azure Key Vault

Utilisé pour stocker les secrets de l'application de manière sécurisée.\
L'application y accède via une **Managed Identity**.

### Azure Blob Storage

Utilisé pour exporter les tâches au format JSON dans un conteneur Blob.

### Deployment Slots

Utilisés pour disposer d'un environnement **staging** séparé de la
production afin de tester avant mise en production.

------------------------------------------------------------------------

## Managed Identity

Une identité managée système est activée sur : 
- l'App Service de
production
- le slot staging

Elle permet : 
- l'accès à Azure Container Registry (AcrPull)
- la lecture des secrets du Key Vault

------------------------------------------------------------------------

## Limites rencontrées

-   Plusieurs Resource Providers Azure ont dû être enregistrés
    manuellement :

    -   Microsoft.ContainerRegistry
    -   Microsoft.DocumentDB
    -   Microsoft.Storage

-   Certaines attributions RBAC via Azure CLI ont échoué dans la
    souscription Azure for Students et ont été réalisées via le portail
    Azure.

-   La démonstration de scaling manuel a été partiellement limitée par
    un throttling temporaire de la souscription Azure :
    `App Service Plan Update operation is throttled`
