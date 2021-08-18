const { errorHandler } = require('../utils');

const skipUrls = ['/', '/signup', '/login'];

module.exports = (db => {
  return async (req, res, next) => {
    try {
      if (skipUrls.includes(req.url)) return next();
      const apiKey = req?.headers?.apikey;
      if (apiKey) {
        const response = await db.collection('users').findOne({ apiKey });
        if (response) {
          req.user = response;
          next();
        } else {
          errorHandler(res, 401, 'Not Authenticated');
        }
      } else {
        errorHandler(res, 401, 'Not Authenticated');
      };
    } catch(error) {
      console.log('Error while authenticating', error)
      errorHandler(res, 500, 'General server error');
    }
  };
  
});
