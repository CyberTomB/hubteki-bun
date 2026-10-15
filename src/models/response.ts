export class ErrorResponse extends Response {
  constructor(message: string, status: number = 500) {
    super(JSON.stringify({ error: message }), {
      status: status,
      //   headers: {
      //     "Access-Control-Allow-Origin": "http://localhost:5173",
      //     "Access-Control-Allow-Credentials": "true",
      //     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      //     "Access-Control-Allow-Headers": "Content-Type, Authorization",
      //     "Content-Type": "application/json",
      //   },
    });
  }
}

export class DataResponse<T> extends Response {
  constructor(data: T, status: number = 200) {
    super(JSON.stringify({ data: data }), {
      status: status,
      //   headers: {
      //     "Access-Control-Allow-Origin": "http://localhost:5173",
      //     "Access-Control-Allow-Credentials": "true",
      //     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      //     "Access-Control-Allow-Headers": "Content-Type, Authorization",
      //     "Content-Type": "application/json",
      //   },
    });
  }
}
