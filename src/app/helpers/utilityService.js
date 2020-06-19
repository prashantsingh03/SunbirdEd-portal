const { decrypt } = require('../helpers/crypto');
const _ = require('lodash');
const logger = require('sb_logger_util_v2')
/**
 * Parses string to object
 * @param string
 * @returns {boolean|any}
 */
const parseJson = (string) => {
  try {
    return JSON.parse(string)
  } catch (e) {
    return false;
  }
};

/**
 * Returns a resolved promise after duration mentioned
 * @param duration delay in duration default value is 1000 mili sec
 * @returns {Promise<any>}
 */
const delay = (duration = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration)
  });
};

/***
 * Checks and returns boolean if based on valid string or not
 * @param value Any value to check if it is valid string or not
 * @returns {boolean}
 */
const isValidAndNotEmptyString = (value) => {
  return typeof value === "string" && value.length > 0;
};

/**
 * Checks if value is valid date
 * @param date
 * @returns {boolean}
 */
var isDate = function (date) {
  return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date))) ? true : false;
};

/**
 * Checks 2 dates and returns true if todate > fromdate
 * @param toDate
 * @param fromDate optional:
 * @returns {boolean}
 */
const isDateExpired = function (toDate, fromDate = Date.now()) {
  let expDate = new Date(0);
  expDate.setUTCMilliseconds(toDate);
  let exp = expDate.getTime();
  return isDate(exp) && !(exp > fromDate);
};

/**
 * Parse the nested object & convert to flattern object(key, value)
 * @param {JSON object} data 
 */
const flattenObject = function(data) {
  var result = {};
  function recurse (cur, prop) {
      if (Object(cur) !== cur) {
          result[prop] = cur;
      } else if (Array.isArray(cur)) {
           for(var i=0, l=cur.length; i<l; i++)
               recurse(cur[i], prop + "[" + i + "]");
          if (l == 0)
              result[prop] = [];
      } else {
          var isEmpty = true;
          for (var p in cur) {
              isEmpty = false;
              recurse(cur[p], prop ? prop+"."+p : p);
          }
          if (isEmpty && prop)
              result[prop] = {};
      }
  }
  recurse(data, "");
  return result;
}

/**
* Verifies request and check exp time
* @param encryptedData encrypted data to be decrypted
* @returns {*}
*/
const decodeNChkTime = (encryptedData) => {
  const decryptedData = decrypt(parseJson(decodeURIComponent(encryptedData)));
  const parsedData = parseJson(decryptedData);
  if (isDateExpired(parsedData.exp)) {
    throw new Error('DATE_EXPIRED');
  } else {
    return _.omit(parsedData, ['exp']);
  }
};

/**
 * To log error debug info
 * Later we can log telemetry error events from here
 */
const logError = (req, err, msg) => {
  logger.error({
    URL: req.url,
    body: JSON.stringify(req.body),
    uuid: _.get(req,'headers.x-msgid'),
    did:_.get(req,'headers.x-device-id'),
    msg: '[Portal]: ' + msg,
    error: JSON.stringify(err)
  });
}

const logInfo = (req, err, msg) => {
  logger.info(getLogObj(req, err, msg));
}

const logErr = (req, err, msg) => {
  logger.error( getLogObj(req, err, msg))
}

const logDebug = (req, err, msg) => {
  logger.debug(getLogObj(req, err, msg))
}

const getLogObj = (req, err, msg) => {
  const logObj =  {
    did: _.get(req, 'headers.x-device-id'),
    ts: _.get(req, 'headers.ts'),
    url: _.get(req, 'originalUrl'),
    uid: _.get(req, 'headers.x-msgid'),
    sid: _.get(req, 'sessionID'),
    payload: (JSON.stringify(_.get(req, 'body')) && JSON.stringify(_.get(req, 'body')).length <=500) ? JSON.stringify(_.get(req, 'body')) : '',
    msg: msg,
    error: JSON.stringify(err)
  }
  return logObj;
}

module.exports = { parseJson, delay, isDate, 
  isValidAndNotEmptyString, isDateExpired, 
  decodeNChkTime, logError, logInfo, logDebug, logErr};
