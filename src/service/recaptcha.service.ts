import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { config } from 'src/lib/config';
import { errors } from 'src/lib/errors';

@Injectable()
export default class RecaptchaService {
  private verifyEndpoint = 'https://www.google.com/recaptcha/api/siteverify';
  private dummyKey = 'DUMMY_KEY_THAT_ALWAYS_WORKS';

  constructor(private http: HttpService) {}

  async verifyToken(token: string): Promise<true> {
    if (token === this.dummyKey && config.env !== 'production') {
      // fake an API call for 100 ms then return true
      return new Promise((res) => setTimeout(() => res(true), 100));
    }
    try {
      const resp = await firstValueFrom(
        this.http.post(
          this.verifyEndpoint,
          {
            secret: config.recaptchaSecret,
            response: token,
          },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        ),
      );
      if (!resp.data.success) throw resp.data;
      return true;
    } catch (axiosErr: any) {
      console.log({ axiosErr });
      throw errors.invalidCaptcha;
    }
  }
}
