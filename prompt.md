Problems
1. I had to console.error for the error below. AddWideError() did not work. I think its because you set up logging wrong. please look at auth.ts. I think you are spposed to use withLoggig but im not sure.
2. fix the errror belo

I got this error from ai_planning.trpc.ts and skill panner server function


LOG /src/lib/logging/logger.server.ts:42:3 - http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Flib%2Flogging%2Flogger.server.ts%3A42%3A3
 →  {"event":"http_request","request_id":"2bf60a92-a2e5-4124-9130-4732f5cad598","timestamp":"2026-01-20T15:46:03.103Z","method":"POST","path":"/api/trpc/aiPlanning.generateSkillPlan","status_code":200,"duration_ms":9,"rpc":{"system":"trpc","procedure":"aiPlanning.generateSkillPlan"},"skill_name":"Spanish Fluency","goal_length":34,"ai_operation":"generate_skill_plan","has_context":false}
LOG /src/lib/ai/skill-planner.server.ts:121:5 - http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Flib%2Fai%2Fskill-planner.server.ts%3A121%3A5
 →  Error generating skill plan: APICallError [AI_APICallError]: Invalid schema for response_format 'response': In context=('properties', 'subSkills', 'items', 'properties', 'metrics', 'items'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'unit'.
    at <anonymous> (/home/joshua/Coding/willDo/node_modules/@ai-sdk/provider-utils/src/response-handler.ts:57:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async postToApi (/home/joshua/Coding/willDo/node_modules/@ai-sdk/provider-utils/src/post-to-api.ts:118:28)
    at async OpenAIResponsesLanguageModel.doGenerate (/home/joshua/Coding/willDo/node_modules/@ai-sdk/openai/src/responses/openai-responses-language-model.ts:453:9)
    at async fn (/home/joshua/Coding/willDo/node_modules/ai/src/generate-text/generate-text.ts:574:34)
    at async <anonymous> (/home/joshua/Coding/willDo/node_modules/ai/src/telemetry/record-span.ts:32:24)
    at async _retryWithExponentialBackoff (/home/joshua/Coding/willDo/node_modules/ai/src/util/retry-with-exponential-backoff.ts:96:12)
    at async fn (/home/joshua/Coding/willDo/node_modules/ai/src/generate-text/generate-text.ts:524:36)
    at async <anonymous> (/home/joshua/Coding/willDo/node_modules/ai/src/telemetry/record-span.ts:32:24)
    at async generateText (/home/joshua/Coding/willDo/node_modules/ai/src/generate-text/generate-text.ts:349:12)
    at async inputTokens (/home/joshua/Coding/willDo/src/lib/ai/skill-planner.server.ts:81:20)
    at async eval (/home/joshua/Coding/willDo/src/integrations/trpc/routes/ai_planning.trpc.ts:20:22)
    at async resolveMiddleware (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:571:22)
    at async callRecursive (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:633:20)
    at async callRecursive (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:633:20)
    at async callRecursive (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:633:20)
    at async eval (/home/joshua/Coding/willDo/src/integrations/trpc/init.ts:27:12)
    at async callRecursive (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:633:20)
    at async procedure (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/procedureBuilder.ts:673:20)
    at async <anonymous> (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/http/resolveResponse.ts:373:31)
    at async <anonymous> (/home/joshua/Coding/willDo/node_modules/@trpc/server/src/unstable-core-do-not-import/http/resolveResponse.ts:560:35) {
  cause: undefined,
  url: 'https://api.openai.com/v1/responses',
  requestBodyValues: {
    model: 'gpt-4.1-nano',
    input: [ [Object], [Object] ],
    temperature: undefined,
    top_p: undefined,
    max_output_tokens: undefined,
    text: { format: [Object] },
    conversation: undefined,
    max_tool_calls: undefined,
    metadata: undefined,
    parallel_tool_calls: undefined,
    previous_response_id: undefined,
    store: undefined,
    user: undefined,
    instructions: undefined,
    service_tier: undefined,
    include: undefined,
    prompt_cache_key: undefined,
    prompt_cache_retention: undefined,
    safety_identifier: undefined,
    top_logprobs: undefined,
    truncation: undefined,
    tools: undefined,
    tool_choice: undefined
  },
  statusCode: 400,
  responseHeaders: {
    'alt-svc': 'h3=":443"; ma=86400',
    'cf-cache-status': 'DYNAMIC',
    'cf-ray': '9c0fb3d249eb425b-EWR',
    connection: 'keep-alive',
    'content-length': '382',
    'content-type': 'application/json',
    date: 'Tue, 20 Jan 2026 15:46:03 GMT',
    'openai-organization': 'personal-f76ffu',
    'openai-processing-ms': '15',
    'openai-project': 'proj_WXZ0ZDV2fbxHMIhIiq7eZbND',
    'openai-version': '2020-10-01',
    server: 'cloudflare',
    'set-cookie': '_cfuvid=hIfKaS_xFU3iVCFxDEBSUjRqure4vtZ.EOb5LQ1u6Jk-1768923963322-0.0.1.1-604800000; path=/; domain=.api.openai.com; HttpOnly; Secure; SameSite=None',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-envoy-upstream-service-time': '18',
    'x-request-id': 'req_e24cf7b7160e4c7ba0a5260d0c1c8676'
  },
  responseBody: '{\n' +
    '  "error": {\n' +
    `    "message": "Invalid schema for response_format 'response': In context=('properties', 'subSkills', 'items', 'properties', 'metrics', 'items'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'unit'.",\n` +
    '    "type": "invalid_request_error",\n' +
    '    "param": "text.format.schema",\n' +
    '    "code": "invalid_json_schema"\n' +
    '  }\n' +
    '}',
  isRetryable: false,
  data: {
    error: {
      message: "Invalid schema for response_format 'response': In context=('properties', 'subSkills', 'items', 'properties', 'metrics', 'items'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'unit'.",
      type: 'invalid_request_error',
      param: 'text.format.schema',
      code: 'invalid_json_schema'
    }
  },
  Symbol(vercel.ai.error): true,
  Symbol(vercel.ai.error.AI_APICallError): true
}
