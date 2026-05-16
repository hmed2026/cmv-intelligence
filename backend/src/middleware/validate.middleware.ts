import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array().map((err) => ({
          field: err.type === 'field' ? err.path : err.type,
          message: err.msg,
        })),
      });
      return;
    }

    next();
  };
}
