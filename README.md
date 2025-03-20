# Mistra OPC UA Agent

An intelligent agent for browsing and mapping OPC UA servers using Mistra MCP.

## Features

- Connect to OPC UA servers with secure authentication
- Browse and map complete server node structures
- Identify important tags, variables, and objects
- Retrieve current values and data types
- AI-powered exploration and organization of server contents

## Installation

```bash
# Clone the repository
git clone https://github.com/Krupalp525/mistra-opcua-agent.git
cd mistra-opcua-agent

# Install dependencies
pnpm install
```

## Usage

1. Start the development server:
```bash
pnpm dev
```

2. Use the agent in your code:
```typescript
import { opcuaAgent } from './agents/opcua-agent';

// Example: Connect to an OPC UA server and map its structure
const response = await opcuaAgent.chat(`
  Please connect to the OPC UA server at opc.tcp://server:4840 
  and create a map of all available tags.
`);

// Example: Get specific node values
const response = await opcuaAgent.chat(`
  What is the current value of the temperature sensor at ns=2;s=Temperature?
`);
```

## Configuration

The agent supports various OPC UA connection options:

- Endpoint URL (required)
- Username and password (optional)
- Starting node for browsing (optional)
- Security mode and policy

## Security

The agent uses secure connection modes by default:
- SignAndEncrypt security mode
- Basic256Sha256 security policy
- Proper session management
- Automatic connection cleanup

## License

ISC