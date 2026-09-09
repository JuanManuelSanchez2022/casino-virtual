import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getProfile as getProfileService,
  updateProfile as updateProfileService,
} from '../services/userService';

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const user = await getProfileService(req.userId);

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('GET PROFILE ERROR:', error);

    res.status(400).json({
      error: error.message || 'Error al obtener el perfil.',
    });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { fullName } = req.body;

    const user = await updateProfileService(
      req.userId,
      fullName
    );

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('UPDATE PROFILE ERROR:', error);

    res.status(400).json({
      error: error.message || 'Error al actualizar el perfil.',
    });
  }
};

