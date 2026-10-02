const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("Bun! For real!"),
  },
});

console.log(`Listening on ${server.url}`);
