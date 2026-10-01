const { getInspections } = require('./app/actions.ts');
getInspections().then(console.log).catch(console.error);
