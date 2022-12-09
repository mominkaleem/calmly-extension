const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["openai-key"], (result) => {
      if (result["openai-key"]) {
        const decodedKey = atob(result["openai-key"]);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: "inject", content },
      (response) => {
        if (response.status === "failed") {
          console.log("injection failed.");
        }
      }
    );
  });
};

const generate = async (prompt) => {
  const key = await getKey();
  const url = "https://api.openai.com/v1/completions";

  const completionResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 4000,
      temperature: 0.5,
    }),
  });

  const completion = await completionResponse.json();
  return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
  try {
    sendMessage('generating...')
    const { selectionText } = info;
    const basePromptPrefix = `
      Rephrase the following text so that the output has none of the words from the input.
  
      Text to rephrase: The Fitness Gram Pacer Test is a multi-stage aerobic capacity assessment that gets increasingly difficult as it progresses.
      Output: The Fitness Gram Pacer Test is an examination of one’s physical cardio health that gets harder as time goes on.
      `;
    const baseCompletion = await generate(
      `${basePromptPrefix}${selectionText}`
    );
    sendMessage(baseCompletion.text);
    console.log(baseCompletion.text);
  } catch (error) {
    console.log(error);
    sendMessage(error.toString());
  }
};

chrome.contextMenus.create({
  id: "context-run",
  title: "Rephrase this text",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);
