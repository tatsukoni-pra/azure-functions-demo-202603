using './main.bicep'

param location = 'japaneast'
param servicePrincipalObjectId = '4e3fbad0-ed6d-4da1-950b-abfb17923fb4'
param logAnalyticsWorkspaceId = '/subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/DefaultResourceGroup-EJP/providers/Microsoft.OperationalInsights/workspaces/DefaultWorkspace-ba29533e-1e4c-43a8-898a-a5815e9b577b-EJP'
param cosmosDBConnection = readEnvironmentVariable('COSMOS_DB_CONNECTION')
param isHealthCheckPass = readEnvironmentVariable('IS_HEALTH_CHECK_PASS', 'true')
