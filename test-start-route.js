// Simple test to verify the start route functionality
const fetch = require('node-fetch');

async function testStartRoute() {
  try {
    console.log('Testing start route...');
    
    const response = await fetch('http://localhost:3000/api/training/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialInput: 'START'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response received:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check what state properties are returned
    console.log('\n=== STATE ANALYSIS ===');
    console.log('Has state:', !!data.state);
    console.log('Has scenario:', !!data.scenario);
    console.log('Has persona:', !!data.persona);
    console.log('Has messages:', !!data.messages);
    console.log('Messages count:', data.messages?.length || 0);
    
    if (data.scenario) {
      console.log('Scenario title:', data.scenario.scenario_title);
    }
    
    if (data.persona) {
      console.log('Persona name:', data.persona.name);
    }
    
  } catch (error) {
    console.error('Error testing start route:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testStartRoute();
}

module.exports = { testStartRoute };