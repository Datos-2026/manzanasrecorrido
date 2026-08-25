const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const GEOJSON_PATH = path.join(__dirname, '../../data/manzanas_catastrales.geojson');

async function manzanas(req, res, next) {
  try {
    if (!fs.existsSync(GEOJSON_PATH)) {
      throw new ApiError(404, 'Catálogo de manzanas no disponible en el servidor');
    }

    res.setHeader('Content-Type', 'application/geo+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(GEOJSON_PATH).pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { manzanas };
