const API_URL = "https://api-inference.huggingface.co/models/gpt2";
const headers = {
  "Authorization": "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"
};

async function query(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

// Example usage
const output = query({
  "inputs": "CAn you give me a joke "
});

output.then(data => console.log(data));