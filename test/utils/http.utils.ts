import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppConfig } from '../../src/config';
import { getSignedToken } from '../../src/shared/utils';

interface IAuthOptions {
  userId: string;
  role: string;
  jwtOptions?: JwtModuleOptions;
}

interface IRequestOptions {
  auth: IAuthOptions;
  additionalHeaders?: Record<string, string>;
}
const { service, jwt } = AppConfig.get();
const http = request(service.host);

export const getHeaders = (options: IRequestOptions) => {
  if (!options.auth) return;
  const { userId: uid, role } = options.auth;
  const jwtOptions = options.auth.jwtOptions || jwt;
  const jwtService = new JwtService(jwtOptions);
  const accessToken = getSignedToken({ uid, role }, jwtService);
  return {
    Authorization: `Bearer ${accessToken}`,
    ...options.additionalHeaders,
  };
};

export class HttpRequest {
  static get = async (
    url: string,
    options: IRequestOptions
  ): Promise<request.Test> =>
    await http.get(url).set(getHeaders(options)).send();

  static post = async (
    url: string,
    body: string | object,
    options: IRequestOptions
  ): Promise<request.Test> =>
    await http.post(url).set(getHeaders(options)).send(body);

  static put = async (
    url: string,
    body: string | object,
    options: IRequestOptions
  ): Promise<request.Test> =>
    await http.put(url).set(getHeaders(options)).send(body);

  static patch = async (
    url: string,
    body: string | object,
    options: IRequestOptions
  ): Promise<request.Test> =>
    await http.patch(url).set(getHeaders(options)).send(body);

  static delete = async (
    url: string,
    options: IRequestOptions
  ): Promise<request.Test> =>
    await http.delete(url).set(getHeaders(options)).send();
}
