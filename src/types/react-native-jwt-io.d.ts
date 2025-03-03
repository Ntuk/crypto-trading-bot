declare module 'react-native-jwt-io' {
  export default class JWT {
    encode(
      payload: Record<string, any>,
      secret: string,
      algorithm: string,
      options?: { header?: Record<string, any> }
    ): string;
    
    decode(
      token: string,
      secret?: string,
      options?: Record<string, any>
    ): Record<string, any>;
  }
} 