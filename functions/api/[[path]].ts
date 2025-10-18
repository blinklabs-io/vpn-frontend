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
  
  console.log('Proxying request to:', apiUrl);
  console.log('Request method:', request.method);
  
  const response = await fetch(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual'
  });

  console.log('Upstream response status:', response.status);
  console.log('Upstream response headers:', Object.fromEntries(response.headers.entries()));

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

  const responseHeaders = new Headers();
  
  response.headers.forEach((value, key) => {
    responseHeaders.set(key, value);
  });
  
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  const responseBody = await response.text();
  console.log('Response body length:', responseBody.length);
  console.log('Response body preview:', responseBody.substring(0, 200));

  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
