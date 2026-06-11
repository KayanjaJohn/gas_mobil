import express from 'express';
import { getAccessories, getAccessoryById } from '../controllers/accessoryController';

const router = express.Router();

router.get('/', getAccessories);
router.get('/:id', getAccessoryById);

export default router;
