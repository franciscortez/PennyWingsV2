type RequestHandler = (
  request: Request,
) => Response | Promise<Response>

declare const Deno: {
  env: { get: (name: string) => string | undefined }
  serve: (handler: RequestHandler) => void
}

export const getEnv = (name: string) => Deno.env.get(name)

export const serve = (handler: RequestHandler) => Deno.serve(handler)
