import { createTool } from '@mistra/core/tools';
import { z } from 'zod';
import {
  OPCUAClient,
  AttributeIds,
  NodeClass,
  ClientSession,
} from 'node-opcua';

interface OPCUANode {
  nodeId: string;
  browseName: string;
  displayName: string;
  nodeClass: string;
  dataType?: string;
  value?: any;
  children?: OPCUANode[];
}

export const opcuaTool = createTool({
  name: 'opcua-browser',
  description: 'Browse and map OPC UA server nodes and their values',
  schema: {
    input: z.object({
      endpoint: z.string().describe('OPC UA server endpoint URL'),
      username: z.string().optional().describe('Username for authentication'),
      password: z.string().optional().describe('Password for authentication'),
      startNode: z.string().optional().describe('Starting node ID for browsing (defaults to RootFolder)'),
    }),
    output: z.object({
      serverMap: z.any().describe('Complete map of the OPC UA server structure'),
    }),
  },
  async execute({ input }) {
    return await browseOPCUAServer(input);
  },
});

async function createOPCUAClient(endpoint: string, username?: string, password?: string) {
  const client = OPCUAClient.create({
    endpoint,
    securityMode: 1, // SignAndEncrypt
    securityPolicy: "Basic256Sha256",
    requestedSessionTimeout: 60000,
  });

  await client.connect();
  
  const userIdentity = username && password 
    ? { userName: username, password }
    : null;

  const session = await client.createSession(userIdentity);
  return { client, session };
}

async function browseNode(session: ClientSession, nodeId: string): Promise<OPCUANode[]> {
  const browseResult = await session.browse(nodeId);
  
  if (!browseResult.references) {
    return [];
  }

  const nodes: OPCUANode[] = [];

  for (const reference of browseResult.references) {
    if (reference.isForward) {
      const node: OPCUANode = {
        nodeId: reference.nodeId.toString(),
        browseName: reference.browseName.name,
        displayName: reference.displayName.text,
        nodeClass: NodeClass[reference.nodeClass],
      };

      // If it's a variable, get its value and data type
      if (reference.nodeClass === NodeClass.Variable) {
        try {
          const dataValue = await session.read({
            nodeId: reference.nodeId,
            attributeId: AttributeIds.Value
          });
          
          const dataType = await session.read({
            nodeId: reference.nodeId,
            attributeId: AttributeIds.DataType
          });

          node.value = dataValue.value.value;
          node.dataType = dataType.value.value.toString();
        } catch (error) {
          console.error(`Error reading value for node ${reference.nodeId}:`, error);
        }
      }

      // Recursively browse child nodes
      node.children = await browseNode(session, reference.nodeId.toString());
      nodes.push(node);
    }
  }

  return nodes;
}

async function browseOPCUAServer({ endpoint, username, password, startNode = "ns=0;i=84" }) {
  let client, session;
  
  try {
    ({ client, session } = await createOPCUAClient(endpoint, username, password));
    const serverMap = await browseNode(session, startNode);
    
    return {
      serverMap
    };
  } catch (error) {
    throw new Error(`Failed to browse OPC UA server: ${error.message}`);
  } finally {
    if (session) {
      await session.close();
    }
    if (client) {
      await client.disconnect();
    }
  }
}