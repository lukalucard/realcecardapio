const { join } = require('path');

module.exports = {
  // Diz para o servidor baixar o Chrome e guardar dentro da pasta do projeto
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};