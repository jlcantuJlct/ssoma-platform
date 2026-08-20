const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const genAI = new GoogleGenerativeAI('TU_API_KEY_AQUI');
  const modelsToTest = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.6-flash'];
  
  for (const m of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent('Responde solo con la palabra OK');
        console.log(`Success with ${m}:`, result.response.text().trim());
        return; // exit on first success
      } catch (e) {
        console.error(`ERROR ${m}:`, e.message.substring(0, 100));
      }
  }
}
testModels();
