const Ajv = require('ajv');

const AJVERROR = {
  additionalProperties: 'additionalProperties',
};

const ajv = new Ajv({
  errorDataPath: 'configuration',
  allErrors: true,
  verbose: true,
});

const parseErrors = (errors) =>
  errors.map((error) => {
    const { dataPath, keyword, params, message, parentSchema } = error;
    let errorMessage;
    if (keyword === AJVERROR.additionalProperties) {
      const wrongKey = params.additionalProperty;
      const validKeys = Object.keys(parentSchema.properties);
      errorMessage = `Invalid configuration: ${dataPath} ${message}.\nInvalid key "${wrongKey}" should be one of: ${validKeys}\n`;
    }
    return errorMessage;
  });

const validateObject = (schema, options) => {
  const validate = ajv.compile(schema);
  const valid = validate(options);
  return valid ? [] : parseErrors(validate.errors);
};

module.exports = validateObject;
