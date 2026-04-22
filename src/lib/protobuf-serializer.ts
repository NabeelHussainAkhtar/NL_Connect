import protobuf from 'protobufjs';

const root = protobuf.Root.fromJSON({
    nested: {
        AIRequest: {
            fields: {
                uid: { type: 'string', id: 1 },
                model: { type: 'string', id: 2 },
                messages: {
                    rule: 'repeated',
                    type: 'AIMessage',
                    id: 3
                },
                stream: { type: 'bool', id: 4 },
                params: { type: 'string', id: 5 }
            }
        },
        AIMessage: {
            fields: {
                role: { type: 'string', id: 1 },
                content: { type: 'string', id: 2 }
            }
        },
        AIResponse: {
            fields: {
                content: { type: 'string', id: 1 },
                command: { type: 'string', id: 2 },
                query: { type: 'string', id: 3 }
            }
        },
        DiscoveryRequest: {
            fields: {
                query: { type: 'string', id: 1 },
                context: { type: 'string', id: 2 }
            }
        },
        DiscoveryResult: {
            fields: {
                id: { type: 'string', id: 1 },
                type: { type: 'string', id: 2 },
                title: { type: 'string', id: 3 },
                subtitle: { type: 'string', id: 4 },
                image: { type: 'string', id: 5 },
                path: { type: 'string', id: 6 },
                accent: { type: 'string', id: 7 },
                score: { type: 'float', id: 8 }
            }
        },
        DiscoveryResponse: {
            fields: {
                results: {
                    rule: 'repeated',
                    type: 'DiscoveryResult',
                    id: 1
                }
            }
        }
    }
});

export const AIRequest = root.lookupType('AIRequest');
export const AIResponse = root.lookupType('AIResponse');
export const DiscoveryRequest = root.lookupType('DiscoveryRequest');
export const DiscoveryResponse = root.lookupType('DiscoveryResponse');

export function serializeRequest(request: any): Uint8Array {
    const errMsg = AIRequest.verify(request);
    if (errMsg) throw new Error(errMsg);
    return AIRequest.encode(request).finish();
}

export function deserializeResponse(buffer: Uint8Array): any {
    return AIResponse.decode(buffer);
}

export function serializeResponse(response: any): Uint8Array {
    const errMsg = AIResponse.verify(response);
    if (errMsg) throw new Error(errMsg);
    return AIResponse.encode(response).finish();
}

export function deserializeRequest(buffer: Uint8Array): any {
    return AIRequest.decode(buffer);
}