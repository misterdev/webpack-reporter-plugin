const Ajv = require('ajv');

const ajv = new Ajv({
  errorDataPath: 'configuration',
  allErrors: true,
  verbose: true,
});

/**
 * Checks is the throttle type is correct
 * @param {Boolean | Number | String} throttle - throttle value
 * @returns {Boolean}
 */
const checkThrottleType = (throttle) =>
  typeof throttle === 'boolean' ||
  typeof throttle === 'number' ||
  (typeof throttle === 'string' && throttle.endsWith('ms'));

/**
 * Validates if every throttle value passed as parameter has the correct type
 * @param {Object} options - options to validate
 * @returns {String[]} - an array of validation errors
 */
const validateThrottles = (options) => {
  const errors = [];
  if (options.hooks) {
    const { compiler, compilation } = options.hooks;
    if (compiler) {
      Object.keys(compiler).forEach((hook) => {
        if (!checkThrottleType(compiler[hook])) {
          errors.push(
            `Invalid configuration: hooks.compiler\n "compiler.${hook}" value must be boolean, number or a string ending with "ms"`
          );
        }
      });
    }
    if (compilation) {
      Object.keys(compilation).forEach((hook) => {
        if (!checkThrottleType(compilation[hook])) {
          errors.push(
            `Invalid configuration: hooks.compilation\n "compiler.${hook}" value must be boolean, number or a string ending with "ms"`
          );
        }
      });
    }
  }
  return errors;
};

/**
 * Maps an array of Ajv errors to an array of helpful error messages
 * @param {Array} errors - all the validation errors
 * @returns {String[]} array of error messages
 */
const parseAjvErrors = (errors) =>
  errors.map((error) => {
    const { dataPath, keyword, params, message, parentSchema } = error;
    /** @type String */
    let errorMessage = message;
    if (keyword === 'additionalProperties') {
      const wrongKey = params.additionalProperty;
      const validKeys = Object.keys(parentSchema.properties);
      errorMessage = `Invalid configuration: ${dataPath} ${message}.\nInvalid key "${wrongKey}" must be one of: ${validKeys}\n`;
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
  let errors = [];
  if (!valid) {
    errors = parseAjvErrors(validate.errors);
  } else {
    errors = validateThrottles(options);
  }
  return errors;
};

module.exports = validateObject;
