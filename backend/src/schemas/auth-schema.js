export const signInSchema = {
  type: 'object',
  properties: {
    password: { type: 'string', minLength: 1 },
  },
  required: ['password'],
  additionalProperties: false,
};
