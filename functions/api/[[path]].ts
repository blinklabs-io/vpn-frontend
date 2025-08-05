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
    body: request.body,
    redirect: 'manual'
  });

  if (params.path.join('/') === 'client/profile' && response.status === 302) {
    const location = response.headers.get('location');
    if (location) {
      return new Response(location, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
