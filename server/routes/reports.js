import express from 'express';
// Se añaden las llaves { db } para importar la exportación nombrada
import { db } from '../db/knex.js'; 

const router = express.Router();

router.get('/rendimiento-editores', async (req, res) => {
  const query = `
    SELECT
      s.user_record_id AS user_id,
      json_extract(u.payload_json, '$.email') AS email,
      json_extract(u.payload_json, '$.name') AS nombre,
      MAX(s.last_seen_at) AS ultimo_login
    FROM auth_sessions s
    JOIN app_records u
      ON u.collection_name = 'users'
      AND u.record_id = s.user_record_id
    GROUP BY s.user_record_id;
  `;

  try {
    const resultados = await db.raw(query);
    res.json({ success: true, data: resultados });
  } catch (error) {
    console.error('Error en la consulta de rendimiento:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;