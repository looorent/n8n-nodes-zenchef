import { type INodeType, type INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow'
import { availability } from './resources/availability'

export class Zenchef implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Zenchef',
    name: 'zenchef',
    icon: { light: 'file:assets/zenchef.svg', dark: 'file:assets/zenchef.dark.svg' },
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Check restaurant availability via the Zenchef public widget API',
    defaults: {
      name: 'Zenchef',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [],
    requestDefaults: {
      baseURL: 'https://bookings-middleware.zenchef.com',
      headers: {
        Accept: 'application/json',
      },
    },
    properties: [
      ...availability
    ],
  }
}
