import type { Params } from 'nestjs-pino';

export const pinoHttpConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
    autoLogging: true,
    redact: ['req.headers.authorization', 'req.headers.cookie'],

    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 400) return 'silent';
      return 'info';
    },

    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          params: req.params,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },

    customProps(_req, res) {
      const r = res as any;
      if (!r._pinoBodyPatched) {
        r._pinoBodyPatched = true;
        const original = r.json?.bind(r);
        if (original) {
          r.json = function (body: unknown) {
            r._resBody = body;
            return original(body);
          };
        }
      }
      return { context: 'HTTP' };
    },

    customSuccessObject(_req, res, val) {
      if (process.env.NODE_ENV === 'production') return val;
      const body = (res as any)._resBody;
      return body !== undefined ? { ...val, resBody: body } : val;
    },
  },
};
