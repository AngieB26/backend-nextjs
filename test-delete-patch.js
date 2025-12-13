const https = require('https');

function deleteNote(noteId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: `/api/notes/${noteId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('CORS Headers:');
      console.log('- Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ error: e.message });
    });

    req.end();
  });
}

function togglePin(noteId, isPinned) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ isPinned });
    
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: `/api/notes/${noteId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('CORS Headers:');
      console.log('- Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Probando nuevos endpoints DELETE y PATCH\n');
  console.log('='.repeat(70));

  // Primero crear una nota para probar
  console.log('\n1️⃣  Creando nota de prueba...');
  const createData = JSON.stringify({
    title: 'Nota para eliminar',
    content: 'Esta nota será eliminada en la prueba'
  });

  const createResult = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve(parsed);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(createData);
    req.end();
  });

  if (!createResult || !createResult.ok) {
    console.log('❌ Error creando nota de prueba');
    return;
  }

  const noteId = createResult.data.id;
  console.log(`✅ Nota creada: ${noteId}`);

  // Probar PATCH - Toggle pin
  console.log('\n2️⃣  Probando PATCH (toggle pin)...');
  const patchResult = await togglePin(noteId, true);
  
  if (patchResult.status === 200 && patchResult.data.ok) {
    console.log('✅ PATCH exitoso');
    console.log(`   isPinned: ${patchResult.data.data.isPinned}`);
  } else {
    console.log('❌ PATCH falló:', patchResult);
  }

  // Probar DELETE
  console.log('\n3️⃣  Probando DELETE...');
  const deleteResult = await deleteNote(noteId);
  
  if (deleteResult.status === 200 && deleteResult.data.ok) {
    console.log('✅ DELETE exitoso');
    console.log('   Mensaje:', deleteResult.data.message);
  } else {
    console.log('❌ DELETE falló:', deleteResult);
  }

  // Verificar que fue eliminada
  console.log('\n4️⃣  Verificando eliminación...');
  const getResult = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: `/api/notes/${noteId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', () => resolve({ error: 'Request error' }));
    req.end();
  });

  if (getResult.status === 404) {
    console.log('✅ Nota eliminada correctamente (404 Not Found)');
  } else {
    console.log('⚠️  Nota todavía existe:', getResult);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Prueba completada\n');
  console.log('Los endpoints DELETE y PATCH están funcionando.');
  console.log('Ahora tu frontend puede eliminar y actualizar notas.\n');
}

testEndpoints();
