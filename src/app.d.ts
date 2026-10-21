import type { JWTPayload } from '$lib/server/auth';
declare global {
  namespace App {
    interface Locals {
      user?: JWTPayload;
    }
  }
}
export {};
