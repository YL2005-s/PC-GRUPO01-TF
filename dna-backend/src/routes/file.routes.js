import express from 'express';
import { nuevaBusqueda, obtenerHistorial, obtenerDetalleBusqueda } from '../controllers/search.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/', verifyToken, upload.single('archivo'), nuevaBusqueda);
router.get('/historial', verifyToken, obtenerHistorial);
router.get('/:id', verifyToken, obtenerDetalleBusqueda);

export default router;
