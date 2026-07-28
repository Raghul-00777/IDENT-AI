import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export function validateBody(schema) {
  return (req, res, next) => {
    const validate = ajv.compile(schema);
    const valid = validate(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, status: 400, message: 'Invalid request body', data: null, errors: validate.errors });
    }
    next();
  };
}
