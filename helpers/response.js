/**
 * An enumeration of allowed status values.
 * @readonly
 * @enum {string}
 */
const USERRESPONSE_CODES = {
  SUCCESS: "success",
  ERROR: "error",
	WARNING: "warning"
};

/**
 * Generates a response message object based on a given status and data or error information.
 * @param {string} status - The status of the response, limited to values in the `USERRESPONSE_CODES`.
 * @param {*} dataOrError - Either the data (in case of success) or the error (in case of failure) to be included in the response message.
 * @returns {{status: string, data?: *, error?: *}} An object containing the provided status and either the data or error information.
 * @throws {Error} Throws an error if the provided status is not a valid value from the `USERRESPONSE_CODES`.
 */
const generateResponseMessage = (status, dataOrError) => {
  // check if the provided status is a valid value from the USERRESPONSE_CODES
  if (!Object.values(USERRESPONSE_CODES).includes(status)) {
    throw new Error(`Invalid status value ${status}`);
  }

  if (status === USERRESPONSE_CODES.SUCCESS) {
    // handle success case, where data is passed as second parameter
    return { status, data: dataOrError };
  } else {
    // handle error case, where error is passed as second parameter
    return { status, error: dataOrError };
  }
};

module.exports = { USERRESPONSE_CODES, generateResponseMessage }