const swaggerOptions = {
    swaggerDefinition: {
      info: {
        title: 'Web Scraper API',
        version: '1.0.0',
        description: 'API for web scraping using Puppeteer and various plugins',
      },
      basePath: '/',
    },
    apis: ['./app.js'],
  };
  
export default swaggerOptions;