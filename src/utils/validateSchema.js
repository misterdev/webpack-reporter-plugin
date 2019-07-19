const Ajv = require('ajv');

const ajv = new Ajv({
  errorDataPath: 'configuration',
  allErrors: true,
  verbose: true,
});

/**
 * Maps an array of Ajv errors to an array of helpful error messages
 * @param {Array} errors - all the validation errors
 * @returns {String[]} array of error messages
 */
const parseErrors = (errors) =>
  errors.map((error) => {
    const { dataPath, keyword, params, message, parentSchema } = error;
    /** @type String */
    let errorMessage = message;
    if (keyword === 'additionalProperties') {
      const wrongKey = params.additionalProperty;
      const validKeys = Object.keys(parentSchema.properties);
      errorMessage = `Invalid configuration: ${dataPath} ${message}.\nInvalid key "${wrongKey}" should be one of: ${validKeys}\n`;
    }
    return errorMessage;
  });

/**
 * Validates an object against a given schema
 * @param {Object} schema - options schema
 * @param {Object} options - options that should be validated
 * @returns {String[]} - an array of error messages
 */
const validateObject = (schema, options) => {
  const validate = ajv.compile(schema);
  const valid = validate(options);
  return valid ? [] : parseErrors(validate.errors);
};

module.exports = validateObject;
