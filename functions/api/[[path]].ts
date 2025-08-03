export async function onRequest({ request, params }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const apiUrl = `https://api.b7s.services/api/${params.path.join('/')}${url.search}`;
  
  const response = await fetch(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
