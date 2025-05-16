/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  WORD_DICTIONARY: DurableObjectNamespace;
  // Add any other bindings your worker needs, e.g., KV, R2 buckets
}

export class WordDictionaryDO implements DurableObject {
  state: DurableObjectState;
  env: Env;
  words: string[];
  initialized: boolean;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.words = [];
    this.initialized = false;
    // `blockConcurrencyWhile()` ensures that only one request is active at a time.
    // We will load the latest state from storage when the first request arrives,
    // and every subsequent request will be blocked until the prior request is finished.
    // This prevents race conditions. The `initialize()` method is called once per
    // instance of the Durable Object.
    this.state.blockConcurrencyWhile(async () => {
      await this.initialize();
    });
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      const storedWords = await this.state.storage.get<string[]>('words');
      this.words = storedWords || [];
      this.initialized = true;
    }
  }

  async fetch(request: Request): Promise<Response> {
    // Note: Initialization is now handled by blockConcurrencyWhile in the constructor.
    // So, by the time fetch() is called, this.words should be initialized.

    switch (request.method) {
      case 'GET':
        return new Response(JSON.stringify(this.words));
      case 'PATCH':
        try {
          const data = await request.json() as { word?: string };
          const { word } = data;

          if (word && typeof word === 'string' && word.trim() !== '') {
            if (!this.words.includes(word)) {
              this.words.push(word);
              await this.state.storage.put('words', this.words);
            }
            return new Response(JSON.stringify(this.words));
          } else {
            return new Response('Invalid input: "word" must be a non-empty string.', { status: 400 });
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            return new Response('Invalid JSON body.', { status: 400 });
          }
          console.error('Error in PATCH:', e);
          return new Response('Internal Server Error', { status: 500 });
        }
      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // For a single global dictionary, we use a fixed ID name.
    // You could also derive the ID from the request (e.g., path, header) if you needed multiple dictionary instances.
    const doId = env.WORD_DICTIONARY.idFromName("global-word-dictionary");
    const stub = env.WORD_DICTIONARY.get(doId);

    // Forward the request to the Durable Object.
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
