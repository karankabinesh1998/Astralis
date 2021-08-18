const crypto = require('crypto');

const generateAPIKey = () => {
  return crypto.randomBytes(30).toString('hex');
};

const errorHandler = (res, status, msg) => {
  res.send({ message: msg });
  res.status(status);
};

const encrypt = (val => {
  let cipher = crypto.createCipheriv('aes-256-cbc', process.env.ENCRYPT_KEY, process.env.ENCRYPT_IV);
  let encrypted = cipher.update(val, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
});

const decrypt = (encrypted => {
  let decipher = crypto.createDecipheriv('aes-256-cbc', process.env.ENCRYPT_KEY, process.env.ENCRYPT_IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
});

module.exports = {
  generateAPIKey,
  errorHandler,
  encrypt,
  decrypt
};
