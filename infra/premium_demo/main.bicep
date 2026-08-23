@description('デプロイ先のリージョン')
param location string = 'japaneast'

@description('サービスプリンシパルの Object ID（ロール割り当て用）')
param servicePrincipalObjectId string

@description('既存の Log Analytics Workspace リソース ID')
param logAnalyticsWorkspaceId string

@description('CosmosDB 接続文字列')
@secure()
param cosmosDBConnection string

@description('正常性チェックの成否を制御するフラグ（true/false）')
param isHealthCheckPass string = 'true'

// ============================================================
// Storage Account
// ============================================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'sttatsukonipremium'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

// ============================================================
// Application Insights
// ============================================================
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'api-tatsukoni-premium'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
  }
}

// ============================================================
// App Service Plan (Premium)
// ============================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-tatsukoni-premium'
  location: location
  kind: 'elastic'
  sku: {
    name: 'EP1'
    tier: 'ElasticPremium'
    family: 'EP'
    size: 'EP1'
    capacity: 1
  }
  properties: {
    reserved: true // Linux
  }
}

// ============================================================
// Function App
// ============================================================
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: 'func-tatsukoni-premium'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    siteConfig: {
      linuxFxVersion: 'Node|24'
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'CosmosDBConnection'
          value: cosmosDBConnection
        }
        {
          name: 'IS_HEALTH_CHECK_PASS'
          value: isHealthCheckPass
        }
      ]
      healthCheckPath: '/api/premium_demo/healthCheck'
      cors: {
        allowedOrigins: [
          'https://portal.azure.com'
        ]
      }
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
    }
  }
}

// ============================================================
// Deployment Slot: staging
// ============================================================
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = {
  parent: functionApp
  name: 'staging'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    siteConfig: {
      linuxFxVersion: 'Node|24'
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'CosmosDBConnection'
          value: cosmosDBConnection
        }
        {
          name: 'IS_HEALTH_CHECK_PASS'
          value: isHealthCheckPass
        }
        {
          name: 'AzureWebJobs.testCosmosTrigger.Disabled'
          value: '1'
        }
        {
          name: 'AzureWebJobs.testTimerTrigger.Disabled'
          value: '1'
        }
      ]
      healthCheckPath: '/api/premium_demo/healthCheck'
      cors: {
        allowedOrigins: [
          'https://portal.azure.com'
        ]
      }
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
    }
  }
}

// ============================================================
// Slot-specific settings: スワップ時にスロットに固定する設定
// ============================================================
resource slotConfigNames 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: functionApp
  name: 'slotConfigNames'
  properties: {
    appSettingNames: [
      'AzureWebJobs.testCosmosTrigger.Disabled'
      'AzureWebJobs.testTimerTrigger.Disabled'
    ]
  }
}

// ============================================================
// Role Assignments: サービスプリンシパルに最小権限を付与
// ============================================================
resource roleAssignmentFunctionApp 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(functionApp.id, servicePrincipalObjectId, 'WebsiteContributor')
  scope: functionApp
  properties: {
    principalId: servicePrincipalObjectId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'de139f84-1756-47ae-9be6-808fbbe84772') // Website Contributor
    principalType: 'ServicePrincipal'
  }
}

resource roleAssignmentAppServicePlan 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(appServicePlan.id, servicePrincipalObjectId, 'Reader')
  scope: appServicePlan
  properties: {
    principalId: servicePrincipalObjectId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7') // Reader
    principalType: 'ServicePrincipal'
  }
}

// ============================================================
// Outputs
// ============================================================
output functionAppName string = functionApp.name
output functionAppHostName string = functionApp.properties.defaultHostName
output stagingSlotName string = stagingSlot.name
