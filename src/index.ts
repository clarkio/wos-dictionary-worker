/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * case 'PATCH':
        try {
          const data = await request.json() as { word?: string };
          const { word } = data;

          if (word && typeof word === 'string' && word.trim() !== '') {
            // Direct check for "1" in PATCH handler
            if (word === '1') {
              console.log('PATCH handler caught number "1" directly');
              return new Response(JSON.stringify({ error: 'Numbers are not allowed' }), {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders(request),
                }
              });
            }

            // Check for inappropriate content
            const filterResult = await this.filterWord(word);
            console.log(`Filter result for '${word}':`, filterResult); // Add debugging
            if (!filterResult.allowed) {
              return new Response(JSON.stringify({ error: filterResult.reason }), {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders(request),
                }
              });
            }v` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { shouldBlockWord } from './profanity-filter';
// Make sure we're importing the correct function
console.log('Imported shouldBlockWord function:', !!shouldBlockWord);

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

  async filterWord(word: string): Promise<{ allowed: boolean; reason?: string }> {
    console.log(`Filtering word: '${word}'`);
    const result = await shouldBlockWord(word);
    console.log(`Filter result: ${JSON.stringify(result)}`);
    return result;
  }

  async fetch(request: Request): Promise<Response> {
    // Note: Initialization is now handled by blockConcurrencyWhile in the constructor.
    // So, by the time fetch() is called, this.words should be initialized.

    switch (request.method) {
      case 'OPTIONS':
        return new Response(null, {
          status: 200,
          headers: corsHeaders(request),
        });
      case 'GET':
        return new Response(JSON.stringify(this.words), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(request),
          }
        });
      case 'DELETE':
        try {
          const data = await request.json() as { word?: string };
          const { word } = data;
          if (word && typeof word === 'string' && word.trim() !== '') {
            if (this.words.includes(word)) {
              this.words = this.words.filter(w => w !== word);
              await this.state.storage.put('words', this.words);
              return new Response(JSON.stringify(this.words), {
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders(request),
                }
              });
            }
            return new Response(JSON.stringify({ error: 'Word not found in the dictionary.' }), {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
              }
            });
          }
          return new Response(JSON.stringify({ error: 'Invalid input: "word" must be a non-empty string.' }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(request),
            }
          });
        } catch (error) {
          console.error('Error in DELETE:', error);
          return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(request),
            }
          });

        }
      case 'PATCH':
        try {
          const data = await request.json() as { word?: string };
          const { word } = data;

          if (word && typeof word === 'string' && word.trim() !== '') {
            // Check for inappropriate content
            const filterResult = await this.filterWord(word);
            if (!filterResult.allowed) {
              return new Response(JSON.stringify({ error: filterResult.reason }), {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders(request),
                }
              });
            }

            if (!this.words.includes(word)) {
              this.words.push(word);
              await this.state.storage.put('words', this.words);
            }
            return new Response(JSON.stringify(this.words), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
              }
            });
          } else {
            return new Response(JSON.stringify({ error: 'Invalid input: "word" must be a non-empty string.' }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
              }
            });
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
              }
            });
          }
          console.error('Error in PATCH:', e);
          return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(request),
            }
          });
        }
      default:
        return new Response('Ok', { status: 200, headers: corsHeaders(request) });
    }
  }
}

function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": "*", // or a specific domain like 'https://example.com'
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(request),
      });
    }
    // For a single global dictionary, we use a fixed ID name.
    // You could also derive the ID from the request (e.g., path, header) if you needed multiple dictionary instances.
    const doId = env.WORD_DICTIONARY.idFromName("global-word-dictionary");
    const stub = env.WORD_DICTIONARY.get(doId);

    // Forward the request to the Durable Object.
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
