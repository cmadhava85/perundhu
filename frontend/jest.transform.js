// Custom Jest transform to handle import.meta syntax
export default {
  process(src) {
    // Replace import.meta.env with a global mock
    const code = src
      .replace(/import\.meta\.env/g, 'process.env')
      .replace(/import\.meta/g, '({ env: process.env })');
    
    return { code };
  },
};